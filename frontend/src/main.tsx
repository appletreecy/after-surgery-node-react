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
import TableTwo from "@/pages/TableTwo";
import TableThree from "@/pages/TableThree";
import TableFour from "@/pages/TableFour";
import TableFive from "@/pages/tableFive";
import TableJoined from "@/pages/TableJoined";


const router = createBrowserRouter([
    { path: '/', element: <App />, children: [
            { index: true, element: <TableOne/> },
            { path: 'records', element: <Records/> },
            { path: 'table-one', element: <TableOne/>},
            { path: 'table-two', element: <TableTwo/>},
            { path: 'table-three', element: <TableThree/>},
            { path: 'table-four', element: <TableFour/>},
            { path: 'table-five', element: <TableFive/>},
            { path: 'table-joined', element: <TableJoined/>},
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