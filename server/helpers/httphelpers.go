package helpers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"server/application"
)

func OpenAICompletion(payload application.ChatPrompt) (*application.ChatCompletion, error) {

	// Convert payload to JSON
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		//fmt.Println("Failed to marshal JSON payload:", err)
		return nil, err
	}

	// API key

	// Create HTTP client
	client := &http.Client{}

	// Create POST request
	req, err := http.NewRequest("POST", application.App.Url, bytes.NewBuffer(jsonPayload))
	if err != nil {
		fmt.Println("Failed to create POST request:", err)
		return nil, err
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("API-Key", application.App.Key)

	// Send request
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Failed to send POST request:", err)
		return nil, err
	}
	defer resp.Body.Close()

	// Check response status code
	if resp.StatusCode != http.StatusOK {
		fmt.Println("POST request failed with status:", resp.StatusCode)
		return nil, err
	}

	// Read response body
	var result application.ChatCompletion
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		fmt.Println("Failed to read response body:", err)
		return nil, err
	}
	return &result, nil
}
