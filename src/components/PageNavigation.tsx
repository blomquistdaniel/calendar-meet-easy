import { useNavigate, Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageNavigationProps {
  showBack?: boolean;
  className?: string;
}

const PageNavigation = ({ showBack = true, className }: PageNavigationProps) => {
  const navigate = useNavigate();

  return (
    <div className={className}>
      <div className="flex flex-col gap-2">
        <Button variant="outline" asChild className="gap-2">
          <Link to="/">
            <Home className="h-4 w-4" />
            Home
          </Link>
        </Button>
        {showBack && (
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
      </div>
    </div>
  );
};

export default PageNavigation;
