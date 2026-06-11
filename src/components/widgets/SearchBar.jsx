import { Search } from "lucide-react";

const SearchBar = ({ value, onChange, placeholder = "Search...", className = "" }) => (
    <div className={`relative ${className}`}>
        <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="w-full pl-5 pr-16 py-4 border border-gray-200 rounded-full text-base text-gray-900 outline-none transition-colors focus:border-gray-300 bg-white placeholder:text-gray-400"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all rounded-full flex items-center justify-center">
            <Search className="text-white" size={25} />
        </div>
    </div>
);

export default SearchBar;