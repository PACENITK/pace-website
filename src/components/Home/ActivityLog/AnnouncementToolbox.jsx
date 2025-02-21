import React from 'react';
import { ExternalLink } from 'lucide-react';

const AnnouncementToolbox = () => {
  const announcements = [
    {
      title: "Site Visit to Varahi Dam",
      description: "Witness real-world civil engineering in action and marvel at breathtaking structures",
      link: "./events"
    },
    // {
    //   title: "New Research Publication",
    //   description: "Latest findings in structural engineering",
    //   link: "./events"
    // }
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
      <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Announcements</h3>
      {announcements.map((announcement, index) => (
        <div key={index} className="border-b pb-3 last:border-b-0 hover:bg-gray-50 transition-colors">
          <div className="flex justify-between items-start">
            <div className="pr-2">
              <h4 className="text-sm font-semibold text-gray-700">{announcement.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{announcement.description}</p>
            </div>
            <a 
              href={announcement.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementToolbox;