import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Trash2,
  ShoppingCart,
  Printer,
  Search,
  X,
  Download,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const customerDropdownRef = useRef(null);
  const productDropdownRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();

    // Click outside handler
    const handleClickOutside = (event) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target)
      ) {
        setShowCustomerDropdown(false);
      }
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target)
      ) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/products`);
      setProducts(res.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/customers`);
      setCustomers(res.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const selectCustomer = (customer) => {
    if (customer) {
      setSelectedCustomerId(customer._id);
      setCustomerQuery(customer.name);
      setDiscount(customer.discountPercentage || 0);
    } else {
      setSelectedCustomerId("");
      setCustomerQuery("");
      setDiscount(0);
    }
    setShowCustomerDropdown(false);
  };

  const selectProduct = (product) => {
    if (product) {
      setSelectedProductId(product._id);
      setProductQuery(product.name);
    } else {
      setSelectedProductId("");
      setProductQuery("");
    }
    setShowProductDropdown(false);
  };

  const addToBill = () => {
    if (!selectedProductId) return toast.warning("Please select a product");
    const qty = parseInt(quantity);
    if (qty <= 0) return toast.warning("Quantity must be at least 1");

    const product = products.find((p) => p._id === selectedProductId);
    if (!product) return toast.error("Product not found");

    const existingItem = cart.find(
      (item) => item.product._id === selectedProductId
    );

    const currentCartQty = existingItem ? existingItem.quantity : 0;
    const totalRequestedQty = currentCartQty + qty;

    if (totalRequestedQty > product.stock) {
      return toast.error(
        `Insufficient stock! Only ${product.stock} items available. You already have ${currentCartQty} in cart.`
      );
    }

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product._id === selectedProductId
            ? { ...item, quantity: totalRequestedQty }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: qty }]);
    }

    toast.success(`${product.name} added to bill`);
    // Clear selection after adding
    setSelectedProductId("");
    setProductQuery("");
    setQuantity(1);
  };

  const removeFromBill = (productId) => {
    const item = cart.find((i) => i.product._id === productId);
    setCart(cart.filter((item) => item.product._id !== productId));
    if (item) toast.info(`${item.product.name} removed from bill`);
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal - discountAmount;
    return { subtotal, discountAmount, total };
  };

  const { subtotal, discountAmount, total } = calculateTotal();

  const generatePDF = () => {
    if (cart.length === 0) return toast.warning("Cart is empty");

    try {
      const doc = new jsPDF();
      const customer = customers.find((c) => c._id === selectedCustomerId);

      // Add Company Header
      doc.setFontSize(20);
      doc.text("BILLING SYSTEM", 105, 15, { align: "center" });
      doc.setFontSize(10);
      doc.text("Tax Invoice", 105, 22, { align: "center" });

      // Add Bill Info
      doc.setFontSize(11);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 35);
      doc.text(`Bill No: #INV-${Math.floor(Math.random() * 100000)}`, 15, 42);

      // Add Customer Info
      doc.text("Bill To:", 140, 35);
      doc.setFont("helvetica", "bold");
      doc.text(customer ? customer.name : "Guest Customer", 140, 42);
      doc.setFont("helvetica", "normal");
      if (customer?.phone) doc.text(`Phone: ${customer.phone}`, 140, 49);

      // Add Table
      const tableColumn = ["Item Name", "Quantity", "Rate", "Total"];
      const tableRows = cart.map((item) => [
        item.product.name,
        item.quantity,
        `INR ${item.product.price.toFixed(2)}`,
        `INR ${(item.product.price * item.quantity).toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: 60,
        head: [tableColumn],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: [40, 40, 40] },
        styles: { fontSize: 10 },
      });

      // Add Totals - Safely get finalY
      const finalY = doc.lastAutoTable?.finalY || 150;

      doc.text(`Subtotal: INR ${subtotal.toFixed(2)}`, 140, finalY + 10);
      doc.text(
        `Discount (${discount}%): INR ${discountAmount.toFixed(2)}`,
        140,
        finalY + 17
      );
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Grand Total: INR ${total.toFixed(2)}`, 140, finalY + 25);

      // Add Footer
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("Thank you for your business!", 105, 280, { align: "center" });

      doc.save(`bill_${Date.now()}.pdf`);
      return true;
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Error generating PDF");
      return false;
    }
  };

  const handleBillFinalization = async (action = "print") => {
    if (cart.length === 0) return toast.warning("Cart is empty");
    setIsProcessing(true);

    try {
      // 1. Update stock in backend
      const items = cart.map((item) => ({
        productId: item.product._id,
        quantity: item.quantity,
      }));

      await axios.post(`${API_URL}/api/products/update-stock`, {
        items,
      });

      // 2. Perform requested action
      if (action === "print") {
        window.print();
      } else if (action === "download") {
        generatePDF();
      }

      // 3. Reset billing state
      setCart([]);
      setSelectedCustomerId("");
      setCustomerQuery("");
      setDiscount(0);

      // 4. Refresh products to get updated stock
      fetchProducts();

      toast.success(
        action === "print"
          ? "Bill printed and stock updated!"
          : "Bill downloaded and stock updated!"
      );
    } catch (error) {
      console.error("Error finalizing bill:", error);
      const errorMsg =
        error.response?.data?.error ||
        "Failed to update stock. Bill not finalized.";
      toast.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return true;
    return `${c.name} ${c.phone}`.toLowerCase().includes(q);
  });

  const filteredProducts = products.filter((p) => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2 relative" ref={customerDropdownRef}>
                <Label>Select Customer</Label>
                <div className="relative">
                  <Input
                    placeholder="Search customer by name or phone..."
                    value={customerQuery}
                    onChange={(e) => {
                      setCustomerQuery(e.target.value);
                      setShowCustomerDropdown(true);
                      if (!e.target.value) {
                        setSelectedCustomerId("");
                        setDiscount(0);
                      }
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="pl-9 pr-9"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  {customerQuery && (
                    <button
                      onClick={() => selectCustomer(null)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {showCustomerDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    <div
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 flex items-center justify-between"
                      onClick={() => selectCustomer(null)}
                    >
                      <span>-- Guest Customer --</span>
                    </div>
                    {filteredCustomers.map((c) => (
                      <div
                        key={c._id}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 border-t border-slate-50 ${
                          selectedCustomerId === c._id ? "bg-slate-50" : ""
                        }`}
                        onClick={() => selectCustomer(c)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{c.name}</div>
                            <div className="text-xs text-slate-500">
                              {c.phone}
                            </div>
                          </div>
                          {c.discountPercentage > 0 && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                              {c.discountPercentage}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredCustomers.length === 0 && customerQuery && (
                      <div className="px-3 py-2 text-sm text-slate-500 italic">
                        No customers found
                      </div>
                    )}
                  </div>
                )}

                {selectedCustomerId && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200">
                      Selected:{" "}
                      <span className="font-bold">
                        {
                          customers.find((c) => c._id === selectedCustomerId)
                            ?.name
                        }
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md border border-green-200 font-medium">
                        {discount}% discount applied
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Items to Bill</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 relative" ref={productDropdownRef}>
              <Label>Select Product</Label>
              <div className="relative">
                <Input
                  placeholder="Search product by name..."
                  value={productQuery}
                  onChange={(e) => {
                    setProductQuery(e.target.value);
                    setShowProductDropdown(true);
                    if (!e.target.value) {
                      setSelectedProductId("");
                    }
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  className="pl-9 pr-9"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                {productQuery && (
                  <button
                    onClick={() => selectProduct(null)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {showProductDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredProducts.map((p) => (
                    <div
                      key={p._id}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 border-t border-slate-50 ${
                        selectedProductId === p._id ? "bg-slate-50" : ""
                      }`}
                      onClick={() => selectProduct(p)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div
                            className={`text-xs font-medium ${
                              p.stock <= 5 ? "text-red-500" : "text-slate-500"
                            }`}
                          >
                            Stock: {p.stock || 0}{" "}
                            {p.stock <= 5 && "(Low Stock)"}
                          </div>
                        </div>
                        <div className="font-bold">₹{p.price}</div>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && productQuery && (
                    <div className="px-3 py-2 text-sm text-slate-500 italic">
                      No products found
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <Button onClick={addToBill} className="w-full">
              <ShoppingCart className="mr-2 h-4 w-4" /> Add to Bill
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Current Bill</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.map((item) => (
                <TableRow key={item.product._id}>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>₹{item.product.price}</TableCell>
                  <TableCell>₹{item.product.price * item.quantity}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromBill(item.product._id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {cart.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Bill is empty
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex-col space-y-4 border-t pt-4">
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span>Discount (%):</span>
              <Input
                type="number"
                className="w-20 h-8 text-right bg-slate-100"
                value={discount}
                readOnly
              />
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Grand Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
          <div className="w-full grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleBillFinalization("print")}
              className="w-full "
              
              variant=""
              disabled={isProcessing || cart.length === 0}
            >
              <Printer className="mr-2 h-4 w-4" />{" "}
              {isProcessing ? "Processing..." : "Print Bill"}
            </Button>
            <Button
              onClick={() => handleBillFinalization("download")}
              className="w-full bg-blue-200 text-black"
              variant="outline"
              disabled={isProcessing || cart.length === 0}
            >
              <Download className="mr-2 h-4 w-4 " />{" "}
              {isProcessing ? "Processing..." : "Checkout & Download"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Billing;
