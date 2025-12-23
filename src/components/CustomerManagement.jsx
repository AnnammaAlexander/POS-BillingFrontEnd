import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
import { Trash2, Plus, Edit, X } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    discountPercentage: 0,
  });
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/customers`);
      setCustomers(res.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const handleInputChange = (e) => {
    setNewCustomer({ ...newCustomer, [e.target.name]: e.target.value });
  };

  const handleSaveCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone)
      return toast.warning("Name and Phone are required");
    try {
      if (editingCustomer) {
        await axios.put(
          `${API_URL}/api/customers/${editingCustomer}`,
          newCustomer
        );
        toast.success("Customer updated successfully!");
      } else {
        await axios.post(`${API_URL}/api/customers/add`, newCustomer);
        toast.success("Customer added successfully!");
      }
      setNewCustomer({ name: "", phone: "", email: "", discountPercentage: 0 });
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error(error.response?.data?.error || "Error saving customer");
    }
  };

  const startEditing = (customer) => {
    setNewCustomer({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      discountPercentage: customer.discountPercentage || 0,
    });
    setEditingCustomer(customer._id);
    toast.info(`Editing ${customer.name}`);
  };

  const cancelEditing = () => {
    setNewCustomer({ name: "", phone: "", email: "", discountPercentage: 0 });
    setEditingCustomer(null);
    toast.info("Editing cancelled");
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?"))
      return;
    try {
      await axios.delete(`${API_URL}/api/customers/${id}`);
      toast.success("Customer deleted successfully!");
      fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Error deleting customer");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingCustomer ? "Edit Customer" : "Add New Customer"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter name"
                value={newCustomer.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="Enter phone"
                value={newCustomer.phone}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email"
                value={newCustomer.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountPercentage">Discount (%)</Label>
              <Input
                id="discountPercentage"
                name="discountPercentage"
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={newCustomer.discountPercentage}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveCustomer} className="flex-1">
                {editingCustomer ? (
                  <Edit className="mr-2 h-4 w-4" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {editingCustomer ? "Update" : "Add"}
              </Button>
              {editingCustomer && (
                <Button variant="outline" onClick={cancelEditing}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Discount (%)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer._id}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.email || "-"}</TableCell>
                  <TableCell>{customer.discountPercentage}%</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => startEditing(customer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteCustomer(customer._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No customers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerManagement;
