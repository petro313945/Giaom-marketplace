import { Routes, Route } from 'react-router-dom'

export default function Profile() {
  return (
    <div>
      <h1>Profile Page</h1>
      <Routes>
        <Route path="/" element={<div>Customer Profile</div>} />
        <Route path="/seller" element={<div>Seller Profile</div>} />
        <Route path="/admin" element={<div>Admin Profile</div>} />
      </Routes>
    </div>
  )
}
