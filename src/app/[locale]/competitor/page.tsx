'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Target, Plus, RefreshCw } from 'lucide-react';

export default function CompetitorPage() {
  const [loading] = useState(false);
  const [newCompetitorUrl, setNewCompetitorUrl] = useState('');

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Competitor Analysis</h1>
            <p className="text-gray-600">Analyze and compare with your competitors</p>
          </div>
          <Button variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Add Competitor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Competitor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Enter YouTube channel URL..."
                  value={newCompetitorUrl}
                  onChange={(e) => setNewCompetitorUrl(e.target.value)}
                />
              </div>
              <Button disabled={!newCompetitorUrl.trim()}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* No Data State */}
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No competitor analysis available</h3>
            <p className="text-gray-500 mb-4">Add competitor channels to start analysis</p>
            <p className="text-sm text-gray-400">Recommend adding 2-5 competitor channels</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}