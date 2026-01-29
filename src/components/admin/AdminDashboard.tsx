import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListMusic, History, AlertCircle, TrendingUp } from "lucide-react";

export const AdminDashboard = () => {
  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Pending Submissions</CardTitle>
            <ListMusic className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-slate-500 mt-1">+3 since yesterday</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Active Placements</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-slate-500 mt-1">Across 8 playlists</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Ending in 7 Days</CardTitle>
            <History className="w-4 h-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-slate-500 mt-1">Action required soon</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">System Alerts</CardTitle>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">2</div>
            <p className="text-xs text-slate-500 mt-1">1 payment failed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Pending Queue */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Priority Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold">
                      {i}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Midnight Echoes</p>
                      <p className="text-xs text-slate-500">Artist Name • Lo-fi House</p>
                    </div>
                  </div>
                  <div className="text-xs font-semibold px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                    PAID
                  </div>
                </div>
              ))}
              <button className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
                View All Submissions
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Ending Placements */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Ending Placements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-yellow-600/20 flex items-center justify-center text-yellow-400 font-bold">
                      EP
                    </div>
                    <div>
                      <p className="text-sm font-medium">Summer Breeze</p>
                      <p className="text-xs text-slate-500">Ends in {i + 2} days • Tropical Chill</p>
                    </div>
                  </div>
                  <button className="text-xs font-semibold px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors">
                    Renew
                  </button>
                </div>
              ))}
              <button className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
                Manage Placements
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
