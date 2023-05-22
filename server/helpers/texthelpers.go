package helpers

import (
	"regexp"
	"server/application"
	"strings"

	log "github.com/sirupsen/logrus"
)

func CleanUp(str string) string {
	// Trim
	str = strings.TrimSpace(str)
	// Remove extra newlines
	re := regexp.MustCompile(`\n{3,}`)
	str = re.ReplaceAllString(str, "\n\n")
	// Remove carriage returns
	re = regexp.MustCompile(`\r`)
	str = re.ReplaceAllString(str, "")
	// Remove extra spaces
	re = regexp.MustCompile(` {3,}`)
	str = re.ReplaceAllString(str, " ")
	// Remove tabs
	re = regexp.MustCompile(`\t{1,}`)
	str = re.ReplaceAllString(str, "")

	return str
}

func ChunkText(str string, max_size int) []application.SectionInfo {
	if max_size <= 0 {
		max_size = 500
	}

	log.Info("Chunking text into sections of max size:", max_size)
	// Split into paragraphs
	chunks := strings.Split(string(CleanUp(str)), "\n\n")
	sections := []application.SectionInfo{}

	// Process each paragraph
	section := ""
	idx := 0
	for _, paragraph := range chunks {
		section += paragraph + "\n\n"
		words := len(strings.Split(section, " "))
		// If adding paragraph exceeds max size, add to sections
		if words > max_size {
			sectionInfo := application.SectionInfo{
				Index:      idx,
				Content:    section,
				Words:      words,
				Characters: len(section),
				Tokens:     0,
			}
			sections = append(sections, sectionInfo)
			// Start a new section
			section = ""
			idx++
		}
	}

	// If there was a section remaining, add it
	if section != "" {
		sectionInfo := application.SectionInfo{Index: idx,
			Content:    section,
			Words:      len(strings.Split(section, " ")),
			Characters: len(section),
			Tokens:     0,
		}
		sections = append(sections, sectionInfo)
	}

	log.Info("Chunked text into ", len(sections), " sections")

	return sections
}

func TeamsFilter(text string) string {
	lines := strings.Split(text, "\n")
	sb := strings.Builder{}
	for i := 0; i < len(lines); i++ {
		line := lines[i]
		if strings.Contains(line, "-->") {
			sb.WriteString("\n\n")
			//sb.WriteString(line)
			//sb.WriteString("\n")
			sb.WriteString(lines[i+1])
			sb.WriteString(": ")
			i++
		} else {
			sb.WriteString(line)
			sb.WriteString("\n")
		}
	}
	return sb.String()
}
