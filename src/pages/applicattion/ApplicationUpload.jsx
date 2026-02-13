import React from "react";

const versions = [
  {
  id: 1,
  version: "3.0.0",
  releaseDate: "January 21, 2026",
  url: "http://portal.archilance.net/Archilance%20LLC%20Setup%203.0.0.exe",
  releaseNotes: [
    "Version upgraded with overall performance improvements.",
    "Multiple issues and bugs from previous versions have been fixed.",
    "Added Dark Mode support."
  ],
},
  {
    id: 2,
    version: "2.0.8",
    releaseDate: "December 25, 2025",
    url: "http://portal.archilance.net/Archilance%20LLC%20Setup%202.0.8.exe",
    releaseNotes: [
      "Fixed various bugs reported in previous versions.",
      "Added Working Hour permission to control work-time access.",
      "Improved app stability and responsiveness.",
    ],
  },
  {
    id: 3,
    version: "2.0.7",
    releaseDate: "December 04, 2025",
    url: "http://portal.archilance.net/Archilance%20LLC%20Setup%202.0.7.exe",
    releaseNotes: [
      "Improved app speed for smoother performance.",
      "Clear instructions for cache deletion to prevent errors.",
      "Better overall responsiveness.",
    ],
  },
  {
    id: 4,
    version: "2.0.6",
    releaseDate: "November 19, 2025",
    url: "http://portal.archilance.net/Archilance%20LLC%20Setup%202.0.6.exe",
    releaseNotes: [
      "Improved app speed for smoother performance.",
      "Added clear instructions for cache deletion to avoid errors.",
      "Enhanced overall app responsiveness.",
    ],
  },
  {
    id: 5,
    version: "2.0.5",
    releaseDate: "November 09, 2025",
    url: "http://portal.archilance.net/Archilance%20LLC%20Setup%202.0.5.exe",
    releaseNotes: [
      "Status update feature for project tasks.",
      "Fixed various small bugs to improve stability.",
      "General performance enhancements.",
    ],
  },
  {
    id: 6,
    version: "2.0.4",
    releaseDate: "November 06, 2025",
    url: "http://portal.archilance.net/Archilance%20LLC%20Setup%202.0.4.exe",
    releaseNotes: [
      "New user interface design.",
      "Performance improvements for large projects.",
    ],
  }, 
];

const ApplicationUpload = () => {
  const latestVersion = versions[0];
  const previousVersions = versions.slice(1);

  if (!latestVersion) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center px-4">
        <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-sm">
          <h1 className="text-xl font-semibold text-gray-800">No releases yet</h1>
          <p className="mt-2 text-sm text-gray-600">
            Release data is unavailable right now. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Download Archilance LLC
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Get the latest version or browse previous releases.
          </p>
        </div>

        {/* LATEST VERSION SECTION (Ismein koi tabdeeli nahi) */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-10 border border-indigo-100">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full uppercase">
                  Latest Version
                </span>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  Version {latestVersion.version}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Released on: {latestVersion.releaseDate}
                </p>
              </div>
              <div className="mt-5 sm:mt-0 sm:ml-4 flex-shrink-0">
                <a
                  href={latestVersion.url}
                  download
                  className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform hover:scale-105"
                >
                  Download Now
                </a>
              </div>
            </div>
            <div className="mt-6 border-t border-gray-200 pt-5">
              <h3 className="text-base font-semibold text-gray-800">
                What's new:
              </h3>
              <ul className="mt-3 space-y-1 list-disc list-inside text-sm text-gray-600">
                {latestVersion.releaseNotes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* VERSION HISTORY SECTION (Yahan tabdeeli ki gayi hai) */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            {/* ... Icon ... */}
            Version History
          </h3>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {previousVersions.map((version) => (
                <li key={version.id} className="p-4">
                  {" "}
                  {/* Hover effect hata diya kiyunke action nahi hai */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                    <div className="mb-3 sm:mb-0">
                      <p className="font-semibold text-gray-800">
                        Version {version.version}
                      </p>
                      <p className="text-xs text-gray-500">
                        Released on: {version.releaseDate}
                      </p>
                    </div>

                    {/* <<< YAHAN TABDEELI KI GAYI HAI >>> */}
                    {/* Humne <a> tag ki jagah ek disabled <button> istemaal kiya hai */}
                    <button
                      disabled
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-400 bg-gray-200 cursor-not-allowed"
                    >
                      Archived
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationUpload;
