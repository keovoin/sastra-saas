import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, Sparkles, Send } from 'lucide-react'
import { toast } from 'sonner'
import { isAIConfigured, askAI } from '@/lib/ai'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'


const QUESTIONS = [
  'How energized are you?',
  'How clear are your priorities?',
  'Do you feel supported?',
  'Rate team collaboration',
  'How sustainable is your workload?',
]

const EMOJIS = ['😫', '😟', '😐', '🙂', '🤩']

interface WeekData {
  week: string
  responses: number[][]
  averages: number[]
}

const mockWeeklyData: WeekData[] = [
  { week: 'Week 1', responses: [[3,4,2,5,4],[4,3,3,4,3],[2,4,4,3,3],[5,4,3,4,4],[3,3,4,4,3]], averages: [3.4, 3.6, 3.2, 4.0, 3.4] },
  { week: 'Week 2', responses: [[4,4,3,5,4],[3,4,4,4,4],[3,3,3,4,3],[4,5,4,4,4],[4,3,3,4,3]], averages: [3.6, 3.8, 3.4, 4.2, 3.6] },
  { week: 'Week 3', responses: [[4,5,4,4,4],[3,4,4,5,4],[4,4,3,4,4],[4,4,4,5,5],[3,4,4,4,3]], averages: [3.6, 4.2, 3.8, 4.4, 4.0] },
  { week: 'Week 4', responses: [[5,4,4,5,4],[4,5,4,4,4],[4,4,4,5,4],[5,5,4,4,5],[4,4,4,5,4]], averages: [4.4, 4.4, 4.0, 4.6, 4.2] },
]


export function PulseSurvey() {
  const [ratings, setRatings] = useState<number[]>([0, 0, 0, 0, 0])
  const [submitted, setSubmitted] = useState(false)
  const [aiInsight, setAiInsight] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const chartData = QUESTIONS.map((q, idx) => ({
    question: q.length > 20 ? q.substring(0, 18) + '...' : q,
    'Week 1': mockWeeklyData[0].averages[idx],
    'Week 2': mockWeeklyData[1].averages[idx],
    'Week 3': mockWeeklyData[2].averages[idx],
    'Week 4': mockWeeklyData[3].averages[idx],
  }))

  const setRating = (questionIdx: number, value: number) => {
    setRatings(prev => {
      const next = [...prev]
      next[questionIdx] = value
      return next
    })
  }

  const submitSurvey = () => {
    if (ratings.some(r => r === 0)) {
      toast.error('Please rate all questions before submitting')
      return
    }
    setSubmitted(true)
    toast.success('Pulse survey submitted! Thank you for your feedback.')
  }


  const analyzeInsights = async () => {
    setAiLoading(true)
    const trendSummary = QUESTIONS.map((q, idx) => {
      const trend = mockWeeklyData.map(w => w.averages[idx])
      return `${q}: Week 1=${trend[0]}, Week 2=${trend[1]}, Week 3=${trend[2]}, Week 4=${trend[3]}`
    }).join('\n')

    const prompt = `You are an organizational psychologist. Analyze these team pulse survey results over 4 weeks (scale 1-5):

${trendSummary}

Team size: 8 people
Response rate: ~85%

Provide:
1. Key patterns you notice (improving/declining areas)
2. Potential root causes for any concerning trends
3. 2-3 specific actions the team lead should take
4. One positive highlight to celebrate

Keep it concise and actionable.`

    const result = await askAI(prompt)
    setAiLoading(false)
    if (result.success) {
      setAiInsight(result.content)
      toast.success('Team insights generated')
    } else {
      toast.error(result.error || 'AI analysis failed')
    }
  }

  const overallAvg = mockWeeklyData[3].averages.reduce((s, v) => s + v, 0) / 5
  const previousAvg = mockWeeklyData[2].averages.reduce((s, v) => s + v, 0) / 5
  const trend = overallAvg - previousAvg


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pink-500/10">
            <Heart className="h-6 w-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Team Pulse Survey</h1>
            <p className="text-muted-foreground">Weekly check-in to measure team health and well-being</p>
          </div>
        </div>
        {isAIConfigured() && (
          <Button onClick={analyzeInsights} disabled={aiLoading}>
            <Sparkles className="h-4 w-4 mr-2" />
            {aiLoading ? 'Analyzing...' : 'AI Team Insights'}
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Current Week Average</p>
            <p className="text-3xl font-bold text-foreground mt-1">{overallAvg.toFixed(1)}/5.0</p>
            <p className={`text-sm mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(2)} from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Response Rate</p>
            <p className="text-3xl font-bold text-foreground mt-1">87%</p>
            <p className="text-sm text-muted-foreground mt-1">7 of 8 team members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Highest Rated</p>
            <p className="text-3xl font-bold text-foreground mt-1">Collaboration</p>
            <p className="text-sm text-green-600 mt-1">4.6/5.0 average</p>
          </CardContent>
        </Card>
      </div>


      {/* Survey Form */}
      {!submitted ? (
        <Card>
          <CardHeader>
            <CardTitle>This Week's Pulse</CardTitle>
            <CardDescription>Rate each question from 1 (lowest) to 5 (highest)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {QUESTIONS.map((question, qIdx) => (
              <div key={qIdx} className="space-y-2">
                <p className="text-sm font-medium text-foreground">{qIdx + 1}. {question}</p>
                <div className="flex gap-2">
                  {EMOJIS.map((emoji, eIdx) => {
                    const value = eIdx + 1
                    const isSelected = ratings[qIdx] === value
                    return (
                      <button
                        key={eIdx}
                        onClick={() => setRating(qIdx, value)}
                        className={`w-12 h-12 rounded-lg text-xl transition-all ${
                          isSelected
                            ? 'bg-primary/20 border-2 border-primary scale-110'
                            : 'bg-muted hover:bg-accent border border-border'
                        }`}
                      >
                        {emoji}
                      </button>
                    )
                  })}
                  {ratings[qIdx] > 0 && (
                    <Badge variant="secondary" className="ml-2 self-center">{ratings[qIdx]}/5</Badge>
                  )}
                </div>
              </div>
            ))}
            <Button onClick={submitSurvey} className="w-full">
              <Send className="h-4 w-4 mr-2" /> Submit Pulse
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-500/5">
          <CardContent className="p-6 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-lg font-medium text-foreground">Survey submitted for this week!</p>
            <p className="text-sm text-muted-foreground mt-1">Your responses help the team improve every week.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSubmitted(false); setRatings([0,0,0,0,0]) }}>
              Submit Another Response
            </Button>
          </CardContent>
        </Card>
      )}


      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>4-Week Trend</CardTitle>
          <CardDescription>Average scores per question across the last 4 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="question" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Week 1" fill="#94a3b8" />
                <Bar dataKey="Week 2" fill="#60a5fa" />
                <Bar dataKey="Week 3" fill="#818cf8" />
                <Bar dataKey="Week 4" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* AI Insight */}
      {aiInsight && (
        <Card className="border-purple-200 bg-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI Team Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{aiInsight}</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
