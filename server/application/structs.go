package application

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type Choice struct {
	Index        int     `json:"index"`
	FinishReason string  `json:"finish_reason"`
	Message      Message `json:"message"`
}

type Usage struct {
	CompletionTokens int `json:"completion_tokens"`
	PromptTokens     int `json:"prompt_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

type ChatCompletion struct {
	ID      string   `json:"id"`
	Object  string   `json:"object"`
	Created int      `json:"created"`
	Model   string   `json:"model"`
	Choices []Choice `json:"choices"`
	Usage   Usage    `json:"usage"`
}

type ChatPrompt struct {
	Messages         []Message `json:"messages"`
	MaxTokens        int       `json:"max_tokens"`
	Temperature      float64   `json:"temperature"`
	N                int       `json:"n"`
	Stop             *string   `json:"stop"`
	FrequencyPenalty float64   `json:"frequency_penalty"`
	PresencePenalty  float64   `json:"presence_penalty"`
	TopP             float64   `json:"top_p"`
}

type SectionInfo struct {
	Index      int    `json:"index"`
	Content    string `json:"content"`
	Words      int    `json:"words"`
	Characters int    `json:"characters"`
	Tokens     int    `json:"tokens"`
	Summary    string `json:"summary"`
}

type SummariesRequest struct {
	Messages []Message     `json:"messages"`
	Sections []SectionInfo `json:"sections"`
}

type SummariesRespose struct {
	Index   int    `json:"index"`
	Summary string `json:"summary"`
}

type SummaryRequest struct {
	Messages  []Message          `json:"messages"`
	Summaries []SummariesRespose `json:"summaries"`
}

type SummaryResponse struct {
	Summary string `json:"summary"`
}
