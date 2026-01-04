import React, { useState, useEffect } from 'react';
import { AlertCircle, Package, Plus, Trash2, X, Download, Search, Users, Edit2, ChevronUp, ChevronDown, Folder } from 'lucide-react';

const InventoryApp = () => {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState(['Food', 'Plasticware', 'Beverages', 'Supplies']);
  const [inventory, setInventory] = useState({});
  const [view, setView] = useState('login');
  const [newProduct, setNewProduct] = useState({ name: '', distributor: '', minQuantity: '', currentQuantity: '', notes: '', section: 'Food' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showManageUsers, setShowManageUsers] = useState(false);
  const [showManageSections, setShowManageSections] = useState(false);
  const [newSection, setNewSection] = useState('');
  const [newUserForm, setNewUserForm] = useState({ username: '', password: '', name: '', role: 'staff' });
  const [users, setUsers] = useState([{ id: '1', username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin' }]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const usersResult = await window.storage.get('users', true);
      if (usersResult?.value) setUsers(JSON.parse(usersResult.value));
      
      const sectionsResult = await window.storage.get('sections', true);
      if (sectionsResult?.value) setSections(JSON.parse(sectionsResult.value));
      
      const productsResult = await window.storage.get('products', true);
      if (productsResult?.value) setProducts(JSON.parse(productsResult.value));
      
      const inventoryResult = await window.storage.get('inventory', true);
      if (inventoryResult?.value) setInventory(JSON.parse(inventoryResult.value));
    } catch (error) {
      console.log('Loading fresh data');
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (prods, inv) => {
    try {
      if (prods) {
        await window.storage.set('products', JSON.stringify(prods), true);
        console.log('Products saved:', prods.length);
      }
      if (inv) {
        await window.storage.set('inventory', JSON.stringify(inv), true);
        console.log('Inventory saved');
      }
    } catch (e) {
      console.error('Save error:', e);
      alert('Error saving data: ' + e.message);
    }
  };

  const handleLogin = () => {
    const foundUser = users.find(u => u.username === loginForm.username.trim() && u.password === loginForm.password.trim());
    if (foundUser) {
      setUser(foundUser);
      setView('dashboard');
      setLoginForm({ username: '', password: '' });
    } else {
      alert('Invalid! Use: admin / admin123');
    }
  };

  const addUser = async () => {
    if (!newUserForm.username || !newUserForm.password || !newUserForm.name) return alert('Fill all fields');
    if (users.find(u => u.username === newUserForm.username)) return alert('Username exists');
    
    const newUser = { id: Date.now().toString(), ...newUserForm };
    const updated = [...users, newUser];
    setUsers(updated);
    await window.storage.set('users', JSON.stringify(updated), true);
    alert('User: ' + newUser.username + ' Pass: ' + newUser.password);
    setNewUserForm({ username: '', password: '', name: '', role: 'staff' });
  };

  const deleteUser = async (id) => {
    if (id === '1') return alert('Cannot delete admin');
    if (!confirm('Delete?')) return;
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    await window.storage.set('users', JSON.stringify(updated), true);
  };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.distributor || !newProduct.minQuantity) return alert('Fill required fields');
    const product = { 
      id: Date.now().toString(), 
      name: newProduct.name, 
      distributor: newProduct.distributor, 
      minQuantity: parseInt(newProduct.minQuantity), 
      currentQuantity: newProduct.currentQuantity ? parseInt(newProduct.currentQuantity) : undefined, 
      notes: newProduct.notes,
      section: newProduct.section,
      order: products.filter(p => p.section === newProduct.section).length
    };
    const updatedProducts = [...products, product];
    const updatedInventory = { ...inventory };
    
    if (product.currentQuantity !== undefined) {
      updatedInventory[product.id] = { 
        quantity: product.currentQuantity, 
        notes: product.notes, 
        updatedBy: user.username, 
        updatedAt: new Date().toISOString() 
      };
    }
    
    setProducts(updatedProducts);
    setInventory(updatedInventory);
    
    await saveData(updatedProducts, updatedInventory);
    
    setNewProduct({ name: '', distributor: '', minQuantity: '', currentQuantity: '', notes: '', section: newProduct.section });
    alert('Product added successfully!');
  };

  const updateInventory = async (id, qty, notes) => {
    const updInv = { ...inventory, [id]: { quantity: parseInt(qty) || undefined, notes: notes || '', updatedBy: user.username, updatedAt: new Date().toISOString() }};
    const updProds = products.map(p => p.id === id ? { ...p, currentQuantity: parseInt(qty) || undefined, notes } : p);
    setInventory(updInv);
    setProducts(updProds);
    await saveData(updProds, updInv);
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete?')) return;
    const updProds = products.filter(p => p.id !== id);
    const updInv = { ...inventory };
    delete updInv[id];
    setProducts(updProds);
    setInventory(updInv);
    await saveData(updProds, updInv);
  };

  const editProduct = async () => {
    if (!editingProduct.name || !editingProduct.distributor || !editingProduct.minQuantity) return alert('Fill required fields');
    const updProds = products.map(p => p.id === editingProduct.id ? editingProduct : p);
    setProducts(updProds);
    await saveData(updProds, inventory);
    setEditingProduct(null);
    alert('Product updated!');
  };

  const moveProduct = async (id, direction) => {
    const product = products.find(p => p.id === id);
    const sectionProducts = products.filter(p => p.section === product.section).sort((a, b) => a.order - b.order);
    const currentIndex = sectionProducts.findIndex(p => p.id === id);
    
    if ((direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === sectionProducts.length - 1)) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const temp = sectionProducts[currentIndex];
    sectionProducts[currentIndex] = sectionProducts[newIndex];
    sectionProducts[newIndex] = temp;
    
    const updatedProducts = products.map(p => {
      if (p.section !== product.section) return p;
      const idx = sectionProducts.findIndex(sp => sp.id === p.id);
      return { ...p, order: idx };
    });
    
    setProducts(updatedProducts);
    await saveData(updatedProducts, inventory);
  };

  const addSection = async () => {
    if (!newSection.trim()) return;
    if (sections.includes(newSection.trim())) return alert('Section already exists');
    const updated = [...sections, newSection.trim()];
    setSections(updated);
    await window.storage.set('sections', JSON.stringify(updated), true);
    setNewSection('');
  };

  const deleteSection = async (section) => {
    if (products.some(p => p.section === section)) return alert('Cannot delete section with products');
    if (!confirm('Delete section?')) return;
    const updated = sections.filter(s => s !== section);
    setSections(updated);
    await window.storage.set('sections', JSON.stringify(updated), true);
  };

  const generateReport = () => {
    const toBuy = products.filter(p => {
      const curr = inventory[p.id]?.quantity ?? p.currentQuantity;
      return curr !== undefined && curr < p.minQuantity;
    });
    return toBuy.reduce((acc, p) => {
      if (!acc[p.distributor]) acc[p.distributor] = [];
      const curr = inventory[p.id]?.quantity ?? p.currentQuantity;
      acc[p.distributor].push({ ...p, currentQuantity: curr, needed: p.minQuantity - curr });
      return acc;
    }, {});
  };

  const exportReport = () => {
    const report = generateReport();
    if (Object.keys(report).length === 0) return alert('All inventory levels are good!');
    
    let body = 'PURCHASE ORDER REPORT\n\n';
    body += 'Generated: ' + new Date().toLocaleString() + '\n';
    body += 'By: ' + user.name + '\n\n';
    
    Object.entries(report).forEach(([dist, items]) => {
      body += '\n--- ' + dist + ' ---\n\n';
      items.forEach(i => {
        body += 'Product: ' + i.name + '\n';
        body += '  Current: ' + i.currentQuantity + '\n';
        body += '  Minimum: ' + i.minQuantity + '\n';
        body += '  Need: ' + i.needed + '\n';
        if (i.notes) body += '  Notes: ' + i.notes + '\n';
        body += '\n';
      });
    });
    
    // Copy to clipboard instead of downloading
    navigator.clipboard.writeText(body).then(() => {
      alert('Report copied to clipboard!\n\nYou can now:\n1. Paste into an email to contact@theboabowls.com\n2. Paste into a text file to save\n3. Paste anywhere you need it');
    }).catch(err => {
      alert('Could not copy to clipboard. Please use the "Copy Report" button in the report view.');
    });
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Package className="w-16 h-16 text-indigo-600 animate-pulse" /></div>;

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <Package className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Inventory Manager</h1>
          </div>
          <div className="space-y-4">
            <input type="text" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} className="w-full px-4 py-3 border rounded-lg" placeholder="Username" />
            <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} className="w-full px-4 py-3 border rounded-lg" placeholder="Password" />
            <button onClick={handleLogin} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700">Sign In</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold">Inventory</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">{user.name}</span>
            {user.role === 'admin' && (
              <>
                <button onClick={() => setShowManageSections(true)} className="text-sm text-indigo-600"><Folder className="w-4 h-4 inline mr-1" />Sections</button>
                <button onClick={() => setShowManageUsers(true)} className="text-sm text-indigo-600"><Users className="w-4 h-4 inline mr-1" />Users</button>
              </>
            )}
            <button onClick={() => { setUser(null); setView('login'); }} className="text-sm">Logout</button>
          </div>
        </div>
      </header>

      {showManageSections && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Manage Sections</h2>
              <button onClick={() => setShowManageSections(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <div className="mb-6 p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-4">Add Section</h3>
                <div className="flex gap-2">
                  <input type="text" value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="Section name" className="flex-1 px-3 py-2 border rounded" />
                  <button onClick={addSection} className="bg-indigo-600 text-white px-6 py-2 rounded">Add</button>
                </div>
              </div>
              <div className="space-y-3">
                {sections.map(section => (
                  <div key={section} className="flex justify-between items-center p-4 border rounded">
                    <div>
                      <p className="font-semibold">{section}</p>
                      <p className="text-sm text-gray-500">{products.filter(p => p.section === section).length} products</p>
                    </div>
                    <button onClick={() => deleteSection(section)} className="text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showManageUsers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Users</h2>
              <button onClick={() => setShowManageUsers(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <div className="mb-6 p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-4">Create User</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" value={newUserForm.username} onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })} placeholder="Username" className="px-3 py-2 border rounded" />
                  <input type="text" value={newUserForm.password} onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })} placeholder="Password" className="px-3 py-2 border rounded" />
                  <input type="text" value={newUserForm.name} onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })} placeholder="Full Name" className="px-3 py-2 border rounded" />
                  <select value={newUserForm.role} onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })} className="px-3 py-2 border rounded">
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button onClick={addUser} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded">Create</button>
              </div>
              <div className="space-y-3">
                {users.map(u => (
                  <div key={u.id} className="flex justify-between p-4 border rounded">
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-sm">User: <span className="font-mono">{u.username}</span> | Pass: <span className="font-mono">{u.password}</span></p>
                      <p className="text-xs text-gray-500">{u.role}</p>
                    </div>
                    {u.id !== '1' && <button onClick={() => deleteUser(u.id)} className="text-red-600"><Trash2 className="w-5 h-5" /></button>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Edit Product</h2>
              <button onClick={() => setEditingProduct(null)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Distributor</label>
                  <input type="text" value={editingProduct.distributor} onChange={(e) => setEditingProduct({ ...editingProduct, distributor: e.target.value })} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Min Quantity</label>
                  <input type="number" value={editingProduct.minQuantity} onChange={(e) => setEditingProduct({ ...editingProduct, minQuantity: e.target.value })} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Section</label>
                  <select value={editingProduct.section} onChange={(e) => setEditingProduct({ ...editingProduct, section: e.target.value })} className="w-full px-3 py-2 border rounded">
                    {sections.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Current Quantity</label>
                  <input type="number" value={editingProduct.currentQuantity || ''} onChange={(e) => setEditingProduct({ ...editingProduct, currentQuantity: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="Leave empty if unknown" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea value={editingProduct.notes || ''} onChange={(e) => setEditingProduct({ ...editingProduct, notes: e.target.value })} className="w-full px-3 py-2 border rounded" rows="3" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={editProduct} className="bg-indigo-600 text-white px-6 py-2 rounded">Save Changes</button>
                <button onClick={() => setEditingProduct(null)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-6">
          <button onClick={() => setView('dashboard')} className={'px-4 py-2 rounded font-medium ' + (view === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-white')}>Dashboard</button>
          <button onClick={() => setView('inventory')} className={'px-4 py-2 rounded font-medium ' + (view === 'inventory' ? 'bg-indigo-600 text-white' : 'bg-white')}>Inventory</button>
          <button onClick={() => setView('products')} className={'px-4 py-2 rounded font-medium ' + (view === 'products' ? 'bg-indigo-600 text-white' : 'bg-white')}>Products</button>
          <button onClick={() => setView('report')} className={'px-4 py-2 rounded font-medium ' + (view === 'report' ? 'bg-indigo-600 text-white' : 'bg-white')}>Report</button>
        </div>

        {view === 'dashboard' && (
          <div className="space-y-6">
                          <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded shadow"><h3 className="text-sm text-gray-600">Products</h3><p className="text-3xl font-bold text-indigo-600">{products.length}</p></div>
              <div className="bg-white p-6 rounded shadow"><h3 className="text-sm text-gray-600">Low Stock</h3><p className="text-3xl font-bold text-red-600">{products.filter(p => {
                const curr = inventory[p.id]?.quantity ?? p.currentQuantity;
                return curr !== undefined && curr < p.minQuantity;
              }).length}</p></div>
              <div className="bg-white p-6 rounded shadow"><h3 className="text-sm text-gray-600">Distributors</h3><p className="text-3xl font-bold text-green-600">{new Set(products.map(p => p.distributor)).size}</p></div>
            </div>
            <div className="bg-white rounded shadow">
              <div className="p-6 border-b"><h2 className="text-xl font-bold">Overview</h2></div>
              <div className="p-6">
                {products.length === 0 ? <p className="text-center py-8 text-gray-500">No products</p> : (
                  sections.map(section => {
                    const sectionProducts = products.filter(p => p.section === section).sort((a, b) => a.order - b.order);
                    if (sectionProducts.length === 0) return null;
                    return (
                      <div key={section} className="mb-8">
                        <h3 className="text-lg font-bold mb-3 pb-2 border-b-2 border-indigo-600">{section}</h3>
                        <table className="w-full">
                          <thead><tr className="border-b"><th className="text-left p-3">Product</th><th className="text-left p-3">Distributor</th><th className="text-left p-3">Current</th><th className="text-left p-3">Min</th><th className="text-left p-3">Status</th></tr></thead>
                          <tbody>
                            {sectionProducts.map(p => {
                              const curr = inventory[p.id]?.quantity ?? p.currentQuantity;
                              const low = curr !== undefined && curr < p.minQuantity;
                              return <tr key={p.id} className="border-b"><td className="p-3">{p.name}</td><td className="p-3">{p.distributor}</td><td className="p-3">{curr !== undefined ? curr : '—'}</td><td className="p-3">{p.minQuantity}</td><td className="p-3">{curr === undefined ? <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">Unknown</span> : low ? <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">Low</span> : <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">OK</span>}</td></tr>;
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'products' && (
          <div className="space-y-6">
            {user.role === 'admin' && (
              <div className="bg-white rounded shadow p-6">
                <h2 className="text-xl font-bold mb-4">Add Product</h2>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Name" className="px-3 py-2 border rounded" />
                  <input type="text" value={newProduct.distributor} onChange={(e) => setNewProduct({ ...newProduct, distributor: e.target.value })} placeholder="Distributor" className="px-3 py-2 border rounded" />
                  <select value={newProduct.section} onChange={(e) => setNewProduct({ ...newProduct, section: e.target.value })} className="px-3 py-2 border rounded">
                    {sections.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input type="number" value={newProduct.minQuantity} onChange={(e) => setNewProduct({ ...newProduct, minQuantity: e.target.value })} placeholder="Min Qty" className="px-3 py-2 border rounded" />
                  <input type="number" value={newProduct.currentQuantity} onChange={(e) => setNewProduct({ ...newProduct, currentQuantity: e.target.value })} placeholder="Current (optional)" className="px-3 py-2 border rounded col-span-2" />
                  <textarea value={newProduct.notes} onChange={(e) => setNewProduct({ ...newProduct, notes: e.target.value })} placeholder="Notes" className="px-3 py-2 border rounded col-span-2" rows="2" />
                </div>
                <button onClick={addProduct} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded"><Plus className="w-5 h-5 inline mr-2" />Add</button>
              </div>
            )}
            <div className="bg-white rounded shadow">
              <div className="p-6 border-b flex justify-between"><h2 className="text-xl font-bold">Products</h2><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search" className="px-3 py-2 border rounded" /></div>
              <div className="p-6">
                {sections.map(section => {
                  const sectionProducts = products
                    .filter(p => p.section === section && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .sort((a, b) => a.order - b.order);
                  
                  if (sectionProducts.length === 0) return null;
                  
                  return (
                    <div key={section} className="mb-8">
                      <h3 className="text-lg font-bold mb-3 pb-2 border-b-2 border-indigo-600">{section}</h3>
                      {sectionProducts.map((p, idx) => (
                        <div key={p.id} className="border-b py-4 flex justify-between items-center">
                          <div className="flex-1">
                            <h3 className="font-semibold">{p.name}</h3>
                            <p className="text-sm text-gray-600">Dist: {p.distributor} | Min: {p.minQuantity} | Curr: {p.currentQuantity !== undefined ? p.currentQuantity : '—'}</p>
                            {p.notes && <p className="text-sm text-gray-500 italic">{p.notes}</p>}
                          </div>
                          {user.role === 'admin' && (
                            <div className="flex gap-2 items-center">
                              <div className="flex flex-col gap-1">
                                <button onClick={() => moveProduct(p.id, 'up')} disabled={idx === 0} className={'p-1 ' + (idx === 0 ? 'text-gray-300' : 'text-gray-600 hover:text-gray-800')}><ChevronUp className="w-5 h-5" /></button>
                                <button onClick={() => moveProduct(p.id, 'down')} disabled={idx === sectionProducts.length - 1} className={'p-1 ' + (idx === sectionProducts.length - 1 ? 'text-gray-300' : 'text-gray-600 hover:text-gray-800')}><ChevronDown className="w-5 h-5" /></button>
                              </div>
                              <button onClick={() => setEditingProduct(p)} className="text-indigo-600 hover:text-indigo-800 p-2"><Edit2 className="w-5 h-5" /></button>
                              <button onClick={() => deleteProduct(p.id)} className="text-red-600 hover:text-red-800 p-2"><Trash2 className="w-5 h-5" /></button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {view === 'inventory' && (
          <div className="bg-white rounded shadow">
            <div className="p-6 border-b"><h2 className="text-xl font-bold">Update Inventory</h2></div>
            <div className="p-6 space-y-6">
              {sections.map(section => {
                const sectionProducts = products.filter(p => p.section === section).sort((a, b) => a.order - b.order);
                if (sectionProducts.length === 0) return null;
                
                return (
                  <div key={section}>
                    <h3 className="text-lg font-bold mb-3 pb-2 border-b-2 border-indigo-600">{section}</h3>
                    <div className="space-y-4">
                      {sectionProducts.map(p => {
                        const inv = inventory[p.id] || {};
                        return (
                          <div key={p.id} className="border rounded p-4">
                            <h3 className="font-semibold mb-2">{p.name} (Min: {p.minQuantity})</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <input type="number" value={inv.quantity ?? p.currentQuantity ?? ''} onChange={(e) => updateInventory(p.id, e.target.value, inv.notes || p.notes)} className="px-3 py-2 border rounded" placeholder="Quantity" />
                              <input type="text" value={inv.notes ?? p.notes ?? ''} onChange={(e) => updateInventory(p.id, inv.quantity ?? p.currentQuantity, e.target.value)} className="px-3 py-2 border rounded" placeholder="Notes" />
                            </div>
                            {inv.updatedBy && <p className="text-xs text-gray-500 mt-2">By {inv.updatedBy} on {new Date(inv.updatedAt).toLocaleString()}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'report' && (
          <div className="bg-white rounded shadow">
            <div className="p-6 border-b flex justify-between">
              <h2 className="text-xl font-bold">Purchase Report</h2>
              <div className="flex gap-2">
                <button onClick={() => {
                  const report = generateReport();
                  if (Object.keys(report).length === 0) return alert('All good!');
                  let body = 'PURCHASE ORDER REPORT\n\n' + new Date().toLocaleString() + '\nBy: ' + user.name + '\n\nEmail to: contact@theboabowls.com\n\n';
                  Object.entries(report).forEach(([dist, items]) => {
                    body += '\n--- ' + dist + ' ---\n\n';
                    items.forEach(i => body += 'Product: ' + i.name + '\n  Current: ' + i.currentQuantity + '\n  Min: ' + i.minQuantity + '\n  Need: ' + i.needed + (i.notes ? '\n  Notes: ' + i.notes : '') + '\n\n');
                  });
                  navigator.clipboard.writeText(body).then(() => alert('✓ Report copied to clipboard!\n\nPaste it into an email to:\ncontact@theboabowls.com'));
                }} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Copy Report</button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800"><strong>📧 To send report:</strong> Click "Copy Report" button above, then paste into an email to <strong>contact@theboabowls.com</strong></p>
              </div>
              {Object.entries(generateReport()).length === 0 ? <p className="text-center py-8 text-green-600">All inventory good!</p> : Object.entries(generateReport()).map(([dist, items]) => (
                <div key={dist} className="mb-6"><h3 className="text-lg font-bold mb-3 border-b-2 border-indigo-600 pb-2">{dist}</h3>{items.map(i => (
                  <div key={i.id} className="bg-gray-50 p-4 rounded mb-3"><h4 className="font-semibold">{i.name}</h4><p className="text-sm">Current: {i.currentQuantity} | Min: {i.minQuantity} | Need: {i.needed}</p>{i.notes && <p className="text-sm text-gray-500 italic">{i.notes}</p>}</div>
                ))}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryApp;