import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Calendar, ExternalLink, RefreshCw } from "lucide-react";

export const PlacementManager = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="active" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="active" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Active</TabsTrigger>
            <TabsTrigger value="ending" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Ending Soon</TabsTrigger>
            <TabsTrigger value="historical" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Historical</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm" className="border-slate-800 hover:bg-slate-800 gap-2">
            <RefreshCw className="w-3 h-3" />
            Refresh Status
          </Button>
        </div>

        <TabsContent value="active" className="m-0">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-900/80">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Track</TableHead>
                  <TableHead className="text-slate-400">Playlist</TableHead>
                  <TableHead className="text-slate-400">Duration</TableHead>
                  <TableHead className="text-slate-400">Time Left</TableHead>
                  <TableHead className="text-right text-slate-400">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={i} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <TableCell>
                      <div className="font-medium">Cyberpunk Sunset</div>
                      <div className="text-xs text-slate-500 italic">Electronic • Future Pop</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                          NEON NIGHTS
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="w-3 h-3" />
                        Oct 01 - Oct 31
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-green-400">14 Days</span>
                        <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 w-[60%]" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="ending" className="m-0">
          {/* Ending content placeholder */}
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
            <History className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-slate-400">No placements ending in the next 7 days</h4>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
