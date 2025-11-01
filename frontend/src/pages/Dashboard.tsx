import { Link } from 'react-router-dom';
export default function Dashboard(){
    return (
        <div className="space-y-4">
            <div className="text-2xl font-semibold">Overview</div>
            <p>Use the Records page to manage your after-surgery entries.</p>
            <Link to="/records" className="underline">Go to Records</Link>
        </div>
    );
}