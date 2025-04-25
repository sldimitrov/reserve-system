import { useState } from 'react';
import { Menu, X } from 'lucide-react'; // icon lib: lucide-react
import './style.scss';

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <nav className="bg-white px-6 py-4 shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Just Reserve
                </h1>

                {/* Desktop menu */}
                <ul className="hidden md:flex gap-8 text-gray-700 font-medium">
                    <li className="hover:text-blue-600 cursor-pointer transition">Book</li>
                    <li className="hover:text-blue-600 cursor-pointer transition">Sign Up</li>
                    <li className="hover:text-blue-600 cursor-pointer transition">Contacts</li>
                </ul>

                {/* Mobile menu button */}
                <button
                    onClick={toggleMenu}
                    className="md:hidden text-gray-700 focus:outline-none"
                >
                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <ul className="md:hidden flex flex-col gap-4 mt-4 text-gray-700 font-medium px-2">
                    <li className="hover:text-blue-600 cursor-pointer transition">Book</li>
                    <li className="hover:text-blue-600 cursor-pointer transition">Sign Up</li>
                    <li className="hover:text-blue-600 cursor-pointer transition">Contacts</li>
                </ul>
            )}
        </nav>
    );
}
