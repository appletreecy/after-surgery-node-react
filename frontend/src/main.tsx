import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import './styles/index.css'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Records from './pages/Records'
// @ts-ignore
import NotFound from './pages/NotFound.tsx'
import TableOne from "@/pages/TableOne";


const router = createBrowserRouter([
    { path: '/', element: <App />, children: [
            { index: true, element: <TableOne/> },
            { path: 'records', element: <Records/> },
            { path: 'table-one', element: <TableOne/>},
        ]},
    { path: '/login', element: <Login/> },
    { path: '/register', element: <Register/> },
    { path: '*', element: <NotFound/> }
])


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    </React.StrictMode>
)