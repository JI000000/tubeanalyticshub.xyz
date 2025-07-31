'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, BarChart3, TrendingUp, Target, Calendar, Settings, Eye, Download, ArrowLeft, CheckCircle } from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'video' | 'channel' | 'competitor' | 'trend';
  category: 'marketing' | 'analytics' | 'executive' | 'technical';
  sections: string[];
  estimated_time: string;
  features: string[];
}

export default function CreateReportPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [reportConfig, setReportConfig] = useState({
    title: '',
    description: '',
    dateRange: '30d',
    includeCharts: true,
    includeInsights: true,
    includeRecommendations: true,
    brandColors: {
      primary: '#3B82F6',
      secondary: '#10B981'
    }
  });
  const [generating, setGenerating] = useState(false);

  const templates: ReportTemplate[] = [
    {
      id: 'marketing-performance',
      name: 'Marketing Performance Report',
      description: 'Comprehensive analysis of marketing metrics, audience growth, and engagement trends',
      type: 'channel',
      category: 'marketing',
      sections: ['Executive Summary', 'Audience Analysis', 'Content Performance', 'Growth Metrics', 'Engagement Trends', 'Recommendations'],
      estimated_time: '5-10 minutes',
      features: ['Growth Charts', 'AI Insights', 'Competitor Comparison', 'ROI Analysis']
    },
    {
      id: 'competitor-analysis',
      name: 'Competitor Analysis Report',
      description: 'In-depth comparison with competitors, market positioning analysis',
      type: 'competitor',
      category: 'analytics',
      sections: ['Market Overview', 'SWOT Analysis', 'Performance Comparison', 'Content Strategy', 'Audience Overlap', 'Strategic Recommendations'],
      estimated_time: '10-15 minutes',
      features: ['Competitive Benchmarking', 'Market Share Analysis', 'SWOT Matrix', 'Strategic Insights']
    },
    {
      id: 'content-optimization',
      name: 'Content Optimization Report',
      description: 'AI-powered content analysis with optimization recommendations',
      type: 'video',
      category: 'technical',
      sections: ['Content Overview', 'Performance Analysis', 'SEO Optimization', 'Thumbnail Analysis', 'Engagement Patterns', 'Action Plan'],
      estimated_time: '3-5 minutes',
      features: ['AI Content Analysis', 'SEO Recommendations', 'Thumbnail Optimization', 'A/B Test Suggestions']
    },
    {
      id: 'executive-summary',
      name: 'Executive Summary Report',
      description: 'High-level overview for stakeholders, focusing on key metrics and ROI',
      type: 'channel',
      category: 'executive',
      sections: ['Key Metrics', 'Performance Highlights', 'Growth Summary', 'Revenue Impact', 'Strategic Priorities', 'Next Steps'],
      estimated_time: '2-3 minutes',
      features: ['Executive Dashboard', 'KPI Tracking', 'ROI Metrics', 'Strategic Recommendations']
    }
  ];

  const getTypeIcon = (type: string) => {
    const icons = {
      video: <FileText className="h-5 w-5" />,
      channel: <BarChart3 className="h-5 w-5" />,
      competitor: <Target className="h-5 w-5" />,
      trend: <TrendingUp className="h-5 w-5" />
    };
    return icons[type as keyof typeof icons] || <FileText className="h-5 w-5" />;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      marketing: 'bg-blue-100 text-blue-800',
      analytics: 'bg-green-100 text-green-800',
      executive: 'bg-purple-100 text-purple-800',
      technical: 'bg-orange-100 text-orange-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setReportConfig({
      ...reportConfig,
      title: template.name,
      description: template.description
    });
    setStep(2);
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return;
    
    setGenerating(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      setStep(3);
      
      // Redirect after showing success
      setTimeout(() => {
        window.location.href = '/reports';
      }, 2000);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => step > 1 ? setStep(step - 1) : window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Professional Report</h1>
              <p className="text-gray-600">
                {step === 1 && 'Select a report template that suits your needs'}
                {step === 2 && 'Configure report parameters and styling'}
                {step === 3 && 'Report Generation Complete'}
              </p>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum < step ? 'bg-green-600 text-white' :
                  stepNum === step ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum < step ? <CheckCircle className="h-4 w-4" /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    stepNum < step ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Template Selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template) => (
              <Card 
                key={template.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleTemplateSelect(template)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {getTypeIcon(template.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {template.estimated_time}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{template.description}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Included Sections</h4>
                      <div className="flex flex-wrap gap-1">
                        {template.sections.slice(0, 4).map((section, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                        {template.sections.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.sections.length - 4} More
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Core Features</h4>
                      <div className="flex flex-wrap gap-1">
                        {template.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full mt-4">
                    Select This Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Step 2: Configuration */}
        {step === 2 && selectedTemplate && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Title
                    </label>
                    <Input
                      value={reportConfig.title}
                      onChange={(e) => setReportConfig({
                        ...reportConfig,
                        title: e.target.value
                      })}
                      placeholder="Enter Report Title..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Description
                    </label>
                    <Textarea
                      value={reportConfig.description}
                      onChange={(e) => setReportConfig({
                        ...reportConfig,
                        description: e.target.value
                      })}
                      placeholder="Describe the purpose and use of the report..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Time Range
                    </label>
                    <select
                      value={reportConfig.dateRange}
                      onChange={(e) => setReportConfig({
                        ...reportConfig,
                        dateRange: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="7d">Past 7 Days</option>
                      <option value="30d">Past 30 Days</option>
                      <option value="90d">Past 90 Days</option>
                      <option value="1y">Past 1 Year</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Content Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeCharts"
                        checked={reportConfig.includeCharts}
                        onChange={(e) => setReportConfig({
                          ...reportConfig,
                          includeCharts: e.target.checked
                        })}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="includeCharts" className="text-sm text-gray-700">
                        Include data charts and visualizations
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeInsights"
                        checked={reportConfig.includeInsights}
                        onChange={(e) => setReportConfig({
                          ...reportConfig,
                          includeInsights: e.target.checked
                        })}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="includeInsights" className="text-sm text-gray-700">
                        Include AI insights and analysis
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeRecommendations"
                        checked={reportConfig.includeRecommendations}
                        onChange={(e) => setReportConfig({
                          ...reportConfig,
                          includeRecommendations: e.target.checked
                        })}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="includeRecommendations" className="text-sm text-gray-700">
                        Include optimization recommendations and action plans
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Brand Customization */}
              <Card>
                <CardHeader>
                  <CardTitle>Brand Customization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={reportConfig.brandColors.primary}
                          onChange={(e) => setReportConfig({
                            ...reportConfig,
                            brandColors: {
                              ...reportConfig.brandColors,
                              primary: e.target.value
                            }
                          })}
                          className="w-12 h-10 rounded border border-gray-300"
                        />
                        <Input
                          value={reportConfig.brandColors.primary}
                          onChange={(e) => setReportConfig({
                            ...reportConfig,
                            brandColors: {
                              ...reportConfig.brandColors,
                              primary: e.target.value
                            }
                          })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secondary Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={reportConfig.brandColors.secondary}
                          onChange={(e) => setReportConfig({
                            ...reportConfig,
                            brandColors: {
                              ...reportConfig.brandColors,
                              secondary: e.target.value
                            }
                          })}
                          className="w-12 h-10 rounded border border-gray-300"
                        />
                        <Input
                          value={reportConfig.brandColors.secondary}
                          onChange={(e) => setReportConfig({
                            ...reportConfig,
                            brandColors: {
                              ...reportConfig.brandColors,
                              secondary: e.target.value
                            }
                          })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Template Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {getTypeIcon(selectedTemplate.type)}
                      </div>
                      <div>
                        <h3 className="font-medium">{selectedTemplate.name}</h3>
                        <Badge className={getCategoryColor(selectedTemplate.category)}>
                          {selectedTemplate.category}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Report Sections</h4>
                      <div className="space-y-1">
                        {selectedTemplate.sections.map((section, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                            {section}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Estimated Generation Time</h4>
                      <p className="text-sm text-gray-600">{selectedTemplate.estimated_time}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-3">
                <Button
                  onClick={handleGenerateReport}
                  disabled={!reportConfig.title || generating}
                  className="w-full"
                >
                  {generating ? 'Generating...' : 'Generate Report'}
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep(1)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Change Template
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Report Generated Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Your professional analysis report has been generated and is ready for viewing.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => window.location.href = '/reports'}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Report
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/reports'}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}