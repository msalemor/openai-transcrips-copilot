import { useState } from "react"
import { IMessage, ISectionInfo, ISettings, ISummariesRequest, ISummariesResponse, ISummaryRequest } from "./interfaces"
import { PostSectionsAsync, PostSummariesAsync, PostSummaryAsync } from "./services"
import SampleScriptService from "./services/samplescriptservice"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const defaultSummariesMessages: IMessage[] = [
  { role: 'system', content: `You are an assistant that can help summarize a call transcript, list Azure services discussed, list other technologies discussed, and list action items.` },
  {
    role: 'user', content: `Write a summary of the transcript, list the Azure services discussed, list the other technologies discussed, and list the action items.

Desired format:
Summary:\n
Azure services:\n\n-||-\n\n
Other technologies:\n\n-||-\n\n
Action items:\n\n-||-\n\n

Text: {context}` },
]

const defaultSummaryMessages: IMessage[] = [
  { role: 'system', content: 'You are a general assistant.' },
  {
    role: 'user', content: `For the following same call transcript summaries, collate the summaries, collate the list of Azure Services, collate the list of other technologies, and collate the list of action items.

Desired format:
Summary:\n
Azure services:\n\n-||-\n\n
Other technologies:\n\n-||-\n\n
Action items:\n\n-||-\n\n

Text: {context}` },
]

const App = () => {
  const [settings, setSettings] = useState<ISettings>({
    max_tokens: "1000",
    temperature: "0.3",
    chunk_size: "500",
  })

  const [summariesMessages, setSummariesMessages] = useState<IMessage[]>(defaultSummariesMessages)
  const [summaryMessages, setSummaryMessages] = useState<IMessage[]>(defaultSummaryMessages)

  const [content, setContent] = useState("")
  const [sections, setSections] = useState<ISectionInfo[]>([])
  const [summaries, setSummaries] = useState<ISummariesResponse[]>([])
  const [summary, setSummary] = useState("")
  const [processingSections, setProcessingSections] = useState(false)
  const [processingSummaries, setProcessingSummaries] = useState(false)
  const [processingSummary, setProcessingSummary] = useState(false)

  const LoadSample = () => {
    setContent(SampleScriptService())
  }

  const SetMessage = (area: string, role: string, content: string) => {
    if (area == "summaries") {
      let newMessage = { ...defaultSummariesMessages }
      if (role === "system") {
        newMessage[0].content = content
      } else if (role == "user") {
        newMessage[1].content = content
      }
      setSummariesMessages(newMessage)
    }
    if (area == "summary") {
      let newMessage = { ...defaultSummaryMessages }
      if (role === "system") {
        newMessage[0].content = content
      } else if (role == "user") {
        newMessage[1].content = content
      }
      setSummaryMessages(newMessage)
    }
  }

  const ChunkTranscript = async () => {
    setProcessingSections(true)
    if (content === "") {
      alert("Please copy and paste a transcript or click on Load Sample.")
      return
    }
    const payload = {
      chunk_size: parseInt(settings.chunk_size),
      content,
    }
    let resp = await PostSectionsAsync(payload)
    setSections(resp)
    setProcessingSections(false)
  }

  const ProcessSummaries = async () => {
    setSummaries([])
    setProcessingSummaries(true)
    const messages: IMessage[] = [
      { role: 'system', content: summariesMessages[0].content },
      { role: 'user', content: summariesMessages[1].content },
    ]
    const payload: ISummariesRequest = {
      max_tokens: parseInt(settings.max_tokens),
      temperature: parseFloat(settings.temperature),
      messages,
      sections
    }
    let resp = await PostSummariesAsync(payload)
    if (resp.length === 1) {
      setSummary(resp[0].summary)
    }
    setSummaries(resp)
    setProcessingSummaries(false)
  }

  const ProcessSummary = async () => {
    setSummary("")
    setProcessingSummary(true)
    const messages: IMessage[] = [
      { role: 'system', content: summaryMessages[0].content },
      { role: 'user', content: summaryMessages[1].content },
    ]
    const payload: ISummaryRequest = {
      max_tokens: parseInt(settings.max_tokens),
      temperature: parseFloat(settings.temperature),
      messages,
      summaries
    }
    let resp = await PostSummaryAsync(payload)
    setSummary(resp.summary)
    setProcessingSummary(false)
  }

  const ClearAll = () => {
    setContent("")
    setSections([])
    setSummaries([])
    setSummary("")
    setProcessingSections(false)
    setProcessingSummaries(false)
    setProcessingSummary(false)
  }

  return (
    <div className="container mx-auto">
      <nav className="p-2 bg-slate-700 text-white font-bold">
        OpenAI Summarizer
      </nav>
      <section className="p-2 bg-slate-600">
        <div className="flex flex-row flex-wrap gap-x-2 place-items-center">
          {/* <button className="w-[100px] rounded-full bg-black text-white hover:bg-slate-900 p-1" onClick={UpdateSettings}>Update</button> */}
          <label className="uppercase text-white text-sm font-bold" htmlFor="Tokens">Tokens</label>
          <input type="text" className="rounded px-1 py-0 w-[60px]" value={settings.max_tokens} onChange={(e) => setSettings({ ...settings, max_tokens: e.target.value })} />
          <label className="uppercase text-white text-sm font-bold" htmlFor="Tokens">Temperature</label>
          <input type="text" className="rounded px-1 py-0 w-[50px]" value={settings.temperature} onChange={(e) => setSettings({ ...settings, temperature: e.target.value })} />
          <label className="uppercase text-white text-sm font-bold" htmlFor="Tokens">Chunk Size</label>
          <input type="text" className="rounded px-1 py-0 w-[60px]" value={settings.chunk_size} onChange={(e) => setSettings({ ...settings, chunk_size: e.target.value })} />
        </div>
      </section>
      <main>
        <div className="p-2">
          {/* Results area */}
          <div className="flex flex-col w-full gap-y-2">
            <label className="text-sm font-bold uppercase">Summary of Summaries:</label>
            <div className="w-full border text-white bg-slate-700 border-slate-900 p-2 rounded max-h-[500px] overflow-auto">
              {summary == "" ?
                <>
                  <div hidden={!processingSummary}>
                    <svg role="status" className="inline h-8 w-8 animate-spin mr-2 text-gray-200 dark:text-gray-600 fill-green-500"
                      viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor" />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill" />
                    </svg>
                  </div>
                  <div hidden={processingSummary}>
                    <span className="text-sm font-bold">No results...</span>
                    <ul>
                      <li>Click: Load Sample or paste your own transcript.</li>
                      <li>Click: Chunk Transcript</li>
                      <li>Click: Process Summaries</li>
                      <li>Click: Process Summary</li>
                    </ul>
                  </div>
                </>
                : <ReactMarkdown children={summary} remarkPlugins={[remarkGfm]} />
              }
            </div>
          </div>
        </div>
        <div className="flex flex-row w-full flex-wrap">
          {/* Transcript area */}
          <div className="basis-full md:basis-1/3 flex flex-col p-2 gap-y-2">
            <label className="text-sm font-bold uppercase bg-slate-950 text-white p-1 text-center">Full Transcript</label>
            <button className="w-40 py-2 text-white text-sm font-bold rounded-full border hover:bg-slate-600 border-slate-800 bg-slate-700" onClick={LoadSample}>
              Load Sample
            </button>
            <button className="w-40 py-2 text-white text-sm font-bold rounded-full border hover:bg-blue-600 border-blue-800 bg-blue-700" onClick={ChunkTranscript}>
              Chunk Transcript
            </button>
            <button className="w-40 py-2 text-white text-sm font-bold rounded-full border hover:bg-red-600 border-red-800 bg-red-700" onClick={ClearAll}>
              Clear All
            </button>
            <div>
              <label>WORDS:</label> <span className="font-bold text-sm">{content.length == 0 ? 0 : content.split(' ').length}</span>
              <br />
              <label>CHARACTERS:</label> <span className="font-bold text-sm">{content.length}</span>
            </div>
            <textarea
              placeholder="Click to load the sample transcript or paste your transcript here..."
              className="rounded py-1 px-2 border text-sm" value={content} onChange={(e) => setContent(e.target.value)} rows={20} />
            {/* <button className="w-40 text-white text-sm font-bold rounded-full border hover:bg-blue-600 border-blue-800 bg-blue-700" onClick={GetSections}>
              Chunk Transcript
            </button> */}
          </div>
          <div className="basis-full md:basis-1/3 flex flex-col p-2 gap-y-2">
            {/* Chuncked Sections */}
            <label className="text-sm font-bold uppercase bg-slate-950 text-white p-1 text-center" htmlFor="">Chunked Sections</label>
            <div className="flex flex-col w-full p-3 gap-y-2">
              <label className="text-sm font-bold uppercase" htmlFor="System">GPT System Message</label>
              <textarea className="rounded py-1 px-2 border text-sm" rows={4} value={summariesMessages[0].content} onChange={(e) => SetMessage("summaries", "system", e.target.value)} />
              <label className="text-sm font-bold uppercase" htmlFor="User">GPT User Message</label>
              <textarea className="rounded py-1 px-2 border text-sm" rows={13} value={summariesMessages[1].content} onChange={(e) => SetMessage("summaries", "user", e.target.value)} />
            </div>
            <button hidden={sections.length === 0} disabled={processingSummaries} onClick={ProcessSummaries} className="py-2 w-40 text-white text-sm font-bold rounded-full border hover:bg-blue-600 border-blue-800 bg-blue-700">
              Process Summaries
            </button>
            <div hidden={!processingSections}>
              <svg role="status" className="inline h-8 w-8 animate-spin mr-2 text-gray-200 dark:text-gray-600 fill-green-500"
                viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor" />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill" />
              </svg>
            </div>
            {sections.length == 0 ? null : <div className="flex flex-col w-full gap-y-2">
              {sections.map((section, index) => <div>
                <div key={index}>
                  <label className="uppercase text-sm">Chunk:</label> <span className="font-bold">{section.index + 1}</span>
                  <br />
                  <label className="uppercase text-sm">Words:</label> <span className="font-bold">{section.words}</span>
                  <br />
                  <label className="uppercase text-sm">Characters:</label> <span className="font-bold">{section.characters}</span>
                </div>
                <div className="w-full bg-slate-200 border border-slate-300 p-2 rounded max-h-[300px] overflow-auto" key={index}>
                  <ReactMarkdown children={section.content} remarkPlugins={[remarkGfm]} />
                </div>
              </div>)}
            </div>}
          </div>
          <div className="basis-full md:basis-1/3 flex flex-col p-2 gap-y-2">
            {/* Process summary */}
            <label className="text-sm font-bold uppercase bg-slate-950 text-white p-1 text-center" htmlFor="">Summaries</label>
            <div className="flex flex-col w-full p-3 gap-y-2">
              <label className="text-sm font-bold uppercase" htmlFor="System">GPT System Message</label>
              <textarea className="rounded py-1 px-2 border text-sm" value={summaryMessages[0].content} rows={4} onChange={(e) => SetMessage("summary", "system", e.target.value)} />
              <label className="text-sm font-bold uppercase" htmlFor="User">GPT User Message</label>
              <textarea className="rounded py-1 px-2 border text-sm" value={summaryMessages[1].content} rows={13} onChange={(e) => SetMessage("summary", "user", e.target.value)} />
            </div>
            <button hidden={summaries.length === 0} disabled={processingSummary} onClick={ProcessSummary} className="py-2 w-40 text-white text-sm font-bold rounded-full border hover:bg-blue-600 border-blue-800 bg-blue-700">
              Process Summary
            </button>
            <div hidden={!processingSummaries}>
              <svg role="status" className="inline h-8 w-8 animate-spin mr-2 text-gray-200 dark:text-gray-600 fill-green-500"
                viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor" />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill" />
              </svg>
            </div>
            {summaries.length == 0 ? null : <div className="flex flex-col w-full gap-y-2">
              {summaries.map((summary, index) => <div>
                <div key={index}>
                  <label className="uppercase text-sm">Summary:</label> <span className="font-bold">{summary.index + 1}</span>
                  <br />
                  <label className="uppercase text-sm">Words:</label> <span className="font-bold">{summary.summary.length == 0 ? 0 : summary.summary.split(' ').length}</span>
                  <br />
                  <label className="uppercase text-sm">Characters:</label> <span className="font-bold">{summary.summary.length}</span>
                </div>
                <div className="w-full bg-slate-200 border border-slate-300 p-2 rounded max-h-[300px] overflow-auto" key={index}>
                  <ReactMarkdown children={summary.summary} remarkPlugins={[remarkGfm]} />
                </div>
              </div>)}
            </div>}
          </div>
        </div >
      </main >

    </div >
  )
}

export default App
