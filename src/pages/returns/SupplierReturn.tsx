import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "../../components/ui";

export const SupplierReturnPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <p className="text-sm font-semibold text-primary-dark">RETURNS</p>
          <h2 className="mt-1 text-2xl font-bold text-secondary">Supplier Return</h2>
        </div>
      </div>
      <Card className="p-6">
        <p className="text-sm text-text-secondary">
          Supplier return screen will be implemented next after Party Return testing.
        </p>
      </Card>
    </>
  );
};
