'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, RefreshCw, Filter } from 'lucide-react';

export default function CommentsPage() {
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Comment Analysis</h1>
            <p className="text-gray-600">AI-powered comment sentiment analysis and insights</p>
          </div>
          <Button disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Comments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search content or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All Sentiment</option>
                <option value="positive">Positive Comments</option>
                <option value="neutral">Neutral Comments</option>
                <option value="negative">Negative Comments</option>
              </select>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="published_at">Sort by publish time</option>
                <option value="like_count">Sort by likes</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* No Data State */}
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No comment data available</h3>
            <p className="text-gray-500 mb-4">Start analyzing YouTube comments to see insights here</p>
            <Button onClick={() => window.location.href = '/'}>
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}