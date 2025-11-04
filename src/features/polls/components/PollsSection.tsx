import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PollCard, CreatePollDialog, usePoll } from '@/features/polls';
import { Loading } from '@/components/ui/loading';

interface PollsSectionProps {
  eventId: string;
}

export const PollsSection: React.FC<PollsSectionProps> = ({ eventId }) => {
  const { polls, loading, error, createPoll, vote } = usePoll({
    eventId,
    autoRefresh: true,
  });

  const activePolls = polls.filter((p) => p.status === 'active');
  const closedPolls = polls.filter((p) => p.status === 'closed' || p.status === 'consensus-reached');

  const handleCreatePoll = async (pollData: any) => {
    await createPoll(eventId, pollData);
  };

  const handleVote = async (pollId: string, optionIds: string[]) => {
    await vote(pollId, { option_ids: optionIds });
  };

  if (loading && polls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Polls & Voting</CardTitle>
          <CardDescription>Get quick decisions from your guests</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loading />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Polls & Voting</CardTitle>
          <CardDescription>Get quick decisions from your guests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <p>Failed to load polls: {error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Polls & Voting</CardTitle>
          <CardDescription>
            Let your guests vote on event decisions
          </CardDescription>
        </div>
        <CreatePollDialog eventId={eventId} onCreatePoll={handleCreatePoll} />
      </CardHeader>
      <CardContent>
        {polls.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-100 mb-4">
              <svg
                className="w-8 h-8 text-violet-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No polls yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Create your first poll to let guests vote on music, food, activities,
              or any other event decisions!
            </p>
            <CreatePollDialog
              eventId={eventId}
              onCreatePoll={handleCreatePoll}
              trigger={
                <Button className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Poll
                </Button>
              }
            />
          </div>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">
                Active {activePolls.length > 0 && `(${activePolls.length})`}
              </TabsTrigger>
              <TabsTrigger value="closed">
                Closed {closedPolls.length > 0 && `(${closedPolls.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6">
              {activePolls.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No active polls</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activePolls.map((poll) => (
                    <PollCard
                      key={poll.id}
                      poll={poll}
                      onVote={(optionIds) => handleVote(poll.id, optionIds)}
                      showResults={true}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="closed" className="mt-6">
              {closedPolls.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No closed polls</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {closedPolls.map((poll) => (
                    <PollCard
                      key={poll.id}
                      poll={poll}
                      onVote={(optionIds) => handleVote(poll.id, optionIds)}
                      showResults={true}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
