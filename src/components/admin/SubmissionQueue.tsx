import React from "react";
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ExternalLink, Check, X, Clock } from "lucide-react";

export const SubmissionQueue = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700">All</Button>
          <Button variant="ghost" className="text-slate-400 hover:text-white">Pending</Button>
          <Button variant="ghost" className="text-slate-400 hover:text-white">Approved</Button>
          <Button variant="ghost" className="text-slate-400 hover:text-white">Declined</Button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 italic">Showing 1-10 of 12 submissions</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Submission</TableHead>
              <TableHead className="text-slate-400">Genre/Mood</TableHead>
              <TableHead className="text-slate-400">Payment</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Submitted</TableHead>
              <TableHead className="text-right text-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <div className="font-medium">Neon Dreams</div>
                      <div className="text-xs text-slate-500">Artist Name • 124 BPM</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">Synthwave</span>
                    <span className="text-xs text-slate-500 italic">Late Night, Energetic</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                    PAID
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-blue-400 font-medium">Pending</span>
                  </div>
                </TableCell>
                <TableCell className="text-slate-400 text-sm">
                  Oct 24, 2024
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-400/10">
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10">
                      <X className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-white">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                        <DropdownMenuItem className="hover:bg-slate-800">View Spotify Track</DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-slate-800">Add Internal Note</DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-slate-800 text-red-400">Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
