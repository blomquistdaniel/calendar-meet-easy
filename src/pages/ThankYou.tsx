import { Link, useParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageNavigation from "@/components/PageNavigation";

const ThankYou = () => {
  const { code } = useParams<{ code: string }>();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8 px-4">
        <div className="flex gap-6 items-start justify-center">
          {/* Navigation buttons */}
          <PageNavigation className="shrink-0" />

          {/* Main content */}
          <Card className="max-w-md text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-green-100">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Thank You!</CardTitle>
              <CardDescription className="text-base">
                Your vote has been recorded. The poll organizer will review all responses and get back to everyone soon.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild variant="outline" className="w-full">
                <Link to={`/p/${code}/vote`}>Change My Vote</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/">Create Your Own Poll</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
