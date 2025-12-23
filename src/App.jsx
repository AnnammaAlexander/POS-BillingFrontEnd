import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/blue-theme.css";
import ProductManagement from "./components/ProductManagement";
import CustomerManagement from "./components/CustomerManagement";
import Billing from "./components/Billing";
import { Button } from "./components/ui/button";
import { LayoutDashboard, Receipt, Users, Palette } from "lucide-react";

function App() {
  const [activeTab, setActiveTab] = useState("billing");
  const [isBlueTheme, setIsBlueTheme] = useState(false);

  return (
    <div
      className={`min-h-screen ${
        isBlueTheme ? "blue-theme" : "bg-slate-50 text-slate-900"
      } font-sans`}
    >
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      {/* Navbar */}
      <nav className="border-b bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-slate-900 text-white p-1 rounded">POS</span>{" "}
            Billing App
          </h1>
          <div className="flex space-x-2">
            <Button
              variant={activeTab === "billing" ? "default" : "ghost"}
              onClick={() => setActiveTab("billing")}
            >
              <Receipt className="mr-2 h-4 w-4" /> Billing
            </Button>
            <Button
              variant={activeTab === "products" ? "default" : "ghost"}
              onClick={() => setActiveTab("products")}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" /> Products
            </Button>
            <Button
              variant={activeTab === "customers" ? "default" : "ghost"}
              onClick={() => setActiveTab("customers")}
            >
              <Users className="mr-2 h-4 w-4" /> Customers
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === "products" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold mb-6">Product Management</h2>
            <ProductManagement />
          </div>
        ) : activeTab === "customers" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold mb-6">Customer Management</h2>
            <CustomerManagement />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold mb-6">Billing / POS</h2>
            <Billing />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
