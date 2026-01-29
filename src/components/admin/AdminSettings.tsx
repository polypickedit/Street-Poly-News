import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  DollarSign, 
  ShieldCheck, 
  Save 
} from "lucide-react";

export const AdminSettings = () => {
  return (
    <div className="max-w-4xl space-y-8">
      {/* Submission Pricing */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-5 h-5 text-green-400" />
            <CardTitle className="text-xl">Submission Pricing</CardTitle>
          </div>
          <CardDescription className="text-slate-500">Configure how much you charge for playlist submissions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="standard" className="text-slate-400">Standard Review ($)</Label>
              <Input id="standard" defaultValue="20.00" className="bg-slate-800 border-slate-700 focus:border-blue-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-slate-400">Priority Review ($)</Label>
              <Input id="priority" defaultValue="45.00" className="bg-slate-800 border-slate-700 focus:border-blue-500" />
            </div>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Save className="w-4 h-4" />
            Save Pricing
          </Button>
        </CardContent>
      </Card>

      {/* Admin Management */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-xl">Team & Permissions</CardTitle>
          </div>
          <CardDescription className="text-slate-500">Manage who has access to this dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {[
              { name: "Admin User", email: "admin@taste.com", role: "admin" },
              { name: "Editor Jane", email: "jane@taste.com", role: "editor" }
            ].map((user, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold uppercase">
                    {user.name.substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{user.role}</span>
                  <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-400/10">Remove</Button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="bg-slate-800 hover:bg-slate-700 gap-2">
            <Users className="w-4 h-4" />
            Invite Team Member
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
