import { Facebook, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-gray-100 text-gray-700 px-6 py-10 mt-10">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10">
                {/* Brand */}
                <div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-900">Just Reserve</h2>
                    <p className="text-sm">Your next destination is just a click away.</p>
                </div>

                {/* Links */}
                <div className="flex gap-12 flex-wrap">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Explore</h3>
                        <ul className="space-y-1">
                            <li className="hover:text-blue-600 cursor-pointer">Book</li>
                            <li className="hover:text-blue-600 cursor-pointer">Offers</li>
                            <li className="hover:text-blue-600 cursor-pointer">Sign Up</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Company</h3>
                        <ul className="space-y-1">
                            <li className="hover:text-blue-600 cursor-pointer">About Us</li>
                            <li className="hover:text-blue-600 cursor-pointer">Careers</li>
                            <li className="hover:text-blue-600 cursor-pointer">Contact</li>
                        </ul>
                    </div>
                </div>

                {/* Social */}
                <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold">Follow Us</h3>
                    <div className="flex gap-4">
                        <a href="#"><Facebook className="hover:text-blue-600" /></a>
                        <a href="https://www.instagram.com/just_sync_it/"><Instagram className="hover:text-pink-500" /></a>
                        <a href="#"><Twitter className="hover:text-blue-400" /></a>
                    </div>
                </div>
            </div>

            {/* Bottom */}
            <div className="text-sm text-center mt-10 text-gray-500">
                © {new Date().getFullYear()} Just Sync. All rights reserved.
            </div>
        </footer>
    );
}
