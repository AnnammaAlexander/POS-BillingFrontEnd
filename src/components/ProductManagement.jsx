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

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
  });
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/products`);
      setProducts(res.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleInputChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.price)
      return toast.warning("Name and Price are required");
    try {
      if (editingProduct) {
        await axios.put(
          `${API_URL}/api/products/${editingProduct}`,
          newProduct
        );
        toast.success("Product updated successfully!");
      } else {
        await axios.post(`${API_URL}/api/products/add`, newProduct);
        toast.success("Product added successfully!");
      }
      setNewProduct({ name: "", price: "", stock: "" });
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(error.response?.data?.error || "Error saving product");
    }
  };

  const startEditing = (product) => {
    setNewProduct({
      name: product.name,
      price: product.price,
      stock: product.stock,
    });
    setEditingProduct(product._id);
    toast.info(`Editing ${product.name}`);
  };

  const cancelEditing = () => {
    setNewProduct({ name: "", price: "", stock: "" });
    setEditingProduct(null);
    toast.info("Editing cancelled");
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      await axios.delete(`${API_URL}/api/products/${id}`);
      toast.success("Product deleted successfully!");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error deleting product");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingProduct ? "Edit Product" : "Add New Product"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter name"
                value={newProduct.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                placeholder="Enter price"
                value={newProduct.price}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock (Optional)</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                placeholder="0"
                value={newProduct.stock}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveProduct} className="flex-1">
                {editingProduct ? (
                  <Edit className="mr-2 h-4 w-4" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {editingProduct ? "Update" : "Add"}
              </Button>
              {editingProduct && (
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
          <CardTitle>Product List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>₹{product.price}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => startEditing(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteProduct(product._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No products found
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

export default ProductManagement;
