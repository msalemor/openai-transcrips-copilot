package main

import (
	"net/http"
	"os"
	"server/application"
	"server/helpers"
	"strings"

	log "github.com/sirupsen/logrus"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

var (
	n    int     = 1
	stop *string = nil
)

func init() {
	godotenv.Load()
	application.App = application.AppState{
		Key:     os.Getenv("OPENAI_API_KEY"),
		Url:     os.Getenv("OPENAI_API_URL"),
		AppPort: os.Getenv("APP_PORT"),
	}
	if application.App.AppPort == "" {
		application.App.AppPort = "8080"
	}
}

func main() {

	r := gin.Default()
	r.Use(gin.Logger())
	r.Use(cors.Default())
	r.Use(static.Serve("/", static.LocalFile("./public", true)))

	r.POST("/api/sections", func(c *gin.Context) {
		var payload struct {
			Chunk_Size int    `json:"chunk_size"`
			Content    string `json:"content"`
		}
		if err := c.BindJSON(&payload); err != nil {
			c.AbortWithError(http.StatusBadRequest, err)
			return
		}
		log.Info(payload.Content)
		sections := helpers.ChunkText(payload.Content, payload.Chunk_Size)
		c.JSON(http.StatusOK, sections)
	})

	r.POST("/api/summary", func(c *gin.Context) {
		var payload application.SummaryRequest

		if err := c.BindJSON(&payload); err != nil {
			c.AbortWithError(http.StatusBadRequest, err)
			return
		}

		if len(payload.Messages) != 2 {
			c.Status(http.StatusBadRequest)
			return
		}

		combinedSummaries := ""
		for _, section := range payload.Summaries {
			combinedSummaries += section.Summary + "\n\n"
		}

		var results application.SummariesResponse

		chatPrompt := application.ChatPrompt{
			Messages: []application.Message{
				{Role: "system", Content: payload.Messages[0].Content},
				{Role: "user", Content: strings.Replace(payload.Messages[1].Content, "{context}", combinedSummaries, -1)},
			},
			MaxTokens:   payload.Max_Tokens,
			Temperature: payload.Temperature,
			N:           n,
			Stop:        stop,
		}

		completion, err := helpers.OpenAICompletion(chatPrompt)

		if err != nil {
			c.AbortWithError(http.StatusInternalServerError, err)
			return
		}

		completionText := completion.Choices[0].Message.Content
		results.Summary = completionText

		c.JSON(http.StatusOK, results)
	})

	r.POST("/api/summaries", func(c *gin.Context) {
		var payload application.SummariesRequest

		if err := c.BindJSON(&payload); err != nil {
			c.AbortWithError(http.StatusBadRequest, err)
			return
		}

		if len(payload.Messages) != 2 {
			c.Status(http.StatusBadRequest)
			return
		}

		var results []application.SummariesResponse

		sections := payload.Sections
		for _, section := range sections {
			log.Info("Processing section: ", section.Index+1, " of ", len(sections))

			chatPrompt := application.ChatPrompt{
				Messages: []application.Message{
					{Role: "system", Content: payload.Messages[0].Content},
					{Role: "user", Content: strings.Replace(payload.Messages[1].Content, "{context}", section.Content, -1)},
				},
				MaxTokens:   payload.Max_Tokens,
				Temperature: payload.Temperature,
				N:           n,
				Stop:        stop,
			}

			completion, err := helpers.OpenAICompletion(chatPrompt)

			if err != nil {
				c.AbortWithError(http.StatusInternalServerError, err)
				return
			}

			completionText := completion.Choices[0].Message.Content
			//section.Summary = completionText
			results = append(results, application.SummariesResponse{Index: section.Index, Summary: completionText})
		}

		c.JSON(http.StatusOK, results)
	})

	r.Run(":" + application.App.AppPort)
}
