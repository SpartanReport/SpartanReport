import React, { useState } from 'react';

// Mock data for release notes
const releaseNotes = [
    {
        version: "0.107.0-preview",
        details: [
          {
            feature: "Spartan Report is now Open Sourced!",
            note: "Check out the 'GitHub' button in the footer to see how this app was made!",
          },
        ],
      },
    
  {
    version: "0.106.1-preview",
    details: [
      {
        feature: "Armor FXs and Mythic FXs are now supported",
        note: "Existing Custom Kits have to be deleted and readded to add FXs",
      },
      {
        feature: "Fixed a couple of bugs with the Custom Kits",
        note: null,
      },
    ],
  },
  // Add more release notes here in the same format
];

const ReleaseNotesViewer = () => {
  const [currentIndex, setCurrentIndex] = useState(0); // Start with the most recent release note

  const handleNext = () => {
    if (currentIndex < releaseNotes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div>
      <div className="release-notes">
        <div className="release-note">
          <div className="spartan-description-operations">
            <span style={{ fontStyle: 'italic', fontSize: 'larger' }}>
              {releaseNotes[currentIndex].version}
            </span>
            {releaseNotes[currentIndex].details.map((detail, index) => (
              <div key={index} className="spartan-description-operations">
                <span style={{ fontStyle: 'italic', fontSize: 'larger' }}>
                  - {detail.feature}
                  {detail.note && (
                    <ul>
                      <li>Note: {detail.note}</li>
                    </ul>
                  )}
                </span>
              </div>
            ))}
          </div>
          <div className="releasenotes-container">
            {currentIndex < releaseNotes.length - 1 && (
              <button className="nav-button" onClick={handleNext}>Next &gt;</button>
            )}
            {currentIndex > 0 && (
              <button className="nav-button" onClick={handlePrevious}>&lt; Previous</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReleaseNotesViewer;