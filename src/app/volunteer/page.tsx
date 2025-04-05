"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/volunteer-dialog";
import { toast } from "sonner";
import { UserPlus, Vote, X } from "lucide-react";
import SelfVerification from "@/components/self-verification";

export default function VolunteerPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const candidates = ["Candidate A", "Candidate B"];

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-center text-blue-800">
        Volunteer Election
      </h1>
      <p className="text-center text-gray-600 text-sm mb-6">
        <span className="text-indigo-600 font-bold">1,327</span> participants,
        and
        <span className="text-green-600 font-bold"> 45,000 USDT</span> raised
      </p>

      <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
        <div className="w-full md:w-1/2 flex-shrink-0">
          {/* Volunteer Application */}
          <Card className="bg-white w-full h-full shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <UserPlus className="text-blue-600" />
                <CardTitle>Become a Volunteer Candidate</CardTitle>
              </div>
              <CardDescription>
                Act as a fund executor and help allocate resources for real
                relief efforts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc pl-5 text-gray-700 space-y-1">
                <li className="text-blue-800">
                  Requires Self digital verification
                </li>
                <li className="text-blue-800">Real name must be disclosed</li>
                <li className="text-blue-800">
                  Failure to perform duties will result in blacklisting
                </li>
              </ul>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="apply-button">
                    Apply to Become a Candidate
                  </Button>
                </DialogTrigger>
                <DialogContent className="dialog-content">
                  <DialogClose className="absolute right-4 top-4 rounded-full p-2 opacity-70 ring-offset-background transition-all duration-200 hover:opacity-100 hover:bg-gray-100 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                    <span className="sr-only">Close</span>
                  </DialogClose>
                  <DialogHeader>
                    <DialogTitle className="dialog-title"></DialogTitle>
                  </DialogHeader>
                  {/* Integrate Self Verification Component */}
                  <SelfVerification
                    onSuccess={() => {
                      setIsVerified(true);
                      toast.success("Identity verification successful");
                    }}
                  />

                  {isVerified && (
                    <div className="success-container">
                      <p className="success-message">
                        ✓ Identity successfully verified
                      </p>
                      <Button
                        className="submit-button"
                        onClick={() => {
                          toast.success("Volunteer application submitted 🎉");
                        }}
                      >
                        Submit Volunteer Application
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-1/2 flex-shrink-0">
          {/* Voting Section */}
          <Card className="bg-white w-full h-full shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Vote className="text-green-600" />
                <CardTitle>Vote for Volunteers</CardTitle>
              </div>
              <CardDescription>
                Support the volunteers you trust and help shape the DAO
                direction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700">
                Your contribution gives you voting rights. Number of votes =
                amount donated.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="vote-button" disabled={hasVoted}>
                    {hasVoted ? "Voted" : "Start Voting"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="dialog-content">
                  <DialogClose className="absolute right-4 top-4 rounded-full p-2 opacity-70 ring-offset-background transition-all duration-200 hover:opacity-100 hover:bg-gray-100 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                    <span className="sr-only">Close</span>
                  </DialogClose>
                  <DialogHeader>
                    <DialogTitle className="dialog-title">
                      Choose the candidate you support
                    </DialogTitle>
                  </DialogHeader>
                  <div className="candidate-container">
                    {candidates.map((name) => (
                      <div key={name} className="candidate-item">
                        <span className="candidate-name">{name}</span>
                        <Button
                          size="sm"
                          className="candidate-vote-button"
                          onClick={() => {
                            setHasVoted(true);
                            toast.success(`You voted for ${name} 🎉`);
                          }}
                        >
                          Vote
                        </Button>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
