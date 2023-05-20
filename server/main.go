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

// var promptTemplate string = "Summarize, identify technologies discussed, and list action items for the following:\n\n"
var promptTemplate string = `Write a summary, list Azure services discussed, list other technologies discussed, and list action items

Desired format:
Summary: 
Azure services: -||-
Other tecnologies: -||-
Action items: -||-

Text: {text}
`

var (
	max_tokens  int     = 1000
	temperature float64 = 0.3
	n           int     = 1
	stop        *string = nil
	chunk_size          = 500
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

	r.GET("/api/settings", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"max_tokens": max_tokens, "temperature": temperature, "n": n, "max_section": chunk_size})
	})

	r.POST("/api/settings", func(c *gin.Context) {
		var payload struct {
			Max_Tokens  int     `json:"max_tokens"`
			Temperature float64 `json:"temperature"`
			Chunk_Size  int     `json:"chunk_size"`
		}
		if err := c.BindJSON(&payload); err != nil {
			c.AbortWithError(http.StatusBadRequest, err)
			return
		}

		max_tokens = int(payload.Max_Tokens)
		temperature = float64(payload.Temperature)
		chunk_size = int(payload.Chunk_Size)

		c.JSON(http.StatusOK, gin.H{"max_tokens": max_tokens, "temperature": temperature, "n": n, "max_section": chunk_size})
	})

	r.POST("/api/sections", func(c *gin.Context) {
		var payload struct {
			Content string `json:"content"`
		}
		if err := c.BindJSON(&payload); err != nil {
			c.AbortWithError(http.StatusBadRequest, err)
			return
		}
		log.Info(payload.Content)
		sections := helpers.ChunkText(payload.Content, chunk_size)
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

		var results application.SummariesRespose

		chatPrompt := application.ChatPrompt{
			Messages: []application.Message{
				{Role: "system", Content: payload.Messages[0].Content},
				{Role: "user", Content: strings.Replace(payload.Messages[1].Content, "{context}", combinedSummaries, -1)},
			},
			MaxTokens:   max_tokens,
			Temperature: temperature,
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

		var results []application.SummariesRespose

		sections := payload.Sections
		for _, section := range sections {
			log.Info("Prcessing section: ", section.Index+1, " of ", len(sections))

			chatPrompt := application.ChatPrompt{
				Messages: []application.Message{
					{Role: "system", Content: payload.Messages[0].Content},
					{Role: "user", Content: strings.Replace(payload.Messages[1].Content, "{context}", section.Content, -1)},
				},
				MaxTokens:   max_tokens,
				Temperature: temperature,
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
			results = append(results, application.SummariesRespose{Index: section.Index, Summary: completionText})
		}

		c.JSON(http.StatusOK, results)
	})

	// bytes, _ := os.ReadFile("./transcript.txt")
	// longText := string(bytes)
	// sections := helpers.ChunkText(longText, 500)
	// results := []string{}
	// for _, section := range sections {
	// 	//fmt.Println(section.Index, section.Words, section.Characters)
	// 	//fmt.Print(section.Content)

	// 	log.Info("Prcessing section: ", section.Index+1, " of ", len(sections))

	// 	chatPrompt := application.ChatPrompt{
	// 		Messages: []application.Message{
	// 			{Role: "system", Content: "You are an assistant that can help summarize, list azure services discussed, list other technologies discussed, and list action items."},
	// 			{Role: "user", Content: strings.Replace(promptTemplate, "{text}", section.Content, -1)},
	// 		},
	// 		MaxTokens:        500,
	// 		Temperature:      0.3,
	// 		N:                1,
	// 		Stop:             nil,
	// 		FrequencyPenalty: 0.0,
	// 		PresencePenalty:  0.0,
	// 		TopP:             1.0,
	// 	}

	// 	completion, err := helpers.OpenAICompletion(chatPrompt)

	// 	if err != nil {
	// 		fmt.Println("Failed to generate completion:", err)
	// 		return
	// 	}

	// 	//fmt.Println(completion.Choices[0].Message.Content)
	// 	completionText := completion.Choices[0].Message.Content
	// 	section.Summary = completionText
	// 	fmt.Println(completionText)
	// 	results = append(results, completionText)

	// }

	// allSummaries := ""
	// for _, result := range results {
	// 	allSummaries += result + "\n"
	// }
	// allSummaries = string(helpers.CleanUp(allSummaries))

	// chatPrompt := application.ChatPrompt{
	// 	Messages: []application.Message{
	// 		{Role: "system", Content: "You are a general assistant."},
	// 		{Role: "user", Content: "Collate the following summaries from one call, list all azure services in one list, list all other technologies in one list, list all action items in one list list of action items:\n\n:Text:" + allSummaries},
	// 	},
	// 	MaxTokens:        500,
	// 	Temperature:      0.3,
	// 	N:                1,
	// 	Stop:             nil,
	// 	FrequencyPenalty: 0.0,
	// 	PresencePenalty:  0.0,
	// 	TopP:             1.0,
	// }

	// completion, err := helpers.OpenAICompletion(chatPrompt)
	// if err != nil {
	// 	fmt.Println("Failed to generate completion:", err)
	// 	return
	// }

	// //fmt.Println("Summary:\n", allSummaries)
	// fmt.Println("Completion:\n", completion.Choices[0].Message.Content)

	r.Run(":" + application.App.AppPort)
}
