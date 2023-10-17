import React, { useState } from 'react';
import { Tooltip } from 'react-tippy';
import 'tippy.js/dist/tippy.css'; // don't forget the CSS
import "./RankTable.css";

const RankTable = ({ rankImages, careerLadder, currentRank }) => {
        if (!careerLadder || !careerLadder.Ranks) {
        return null;
    }

    const rankColors = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Onyx'];

    const getRankImageData = (rankIndex) => {
        return rankImages[rankIndex]?.Image;
    };
    const getRankImagesForTooltip = (rankIndex) => {
        const indices = [rankIndex - 1, rankIndex, rankIndex + 1];
        return indices.map(index => getRankImageData(index));
    };
    
    const renderTooltipContent = (rankIndex, rank, color) => {
        const imagesForTooltip = getRankImagesForTooltip(rankIndex);
        return (
            <div className="card-tooltip">
                <div className="tooltip-header">
                    {color} {careerLadder.Ranks[rankIndex]?.RankTitle.value}
                </div>
                <div className="skipped-ranks-container">
                    {imagesForTooltip.map((imageData, idx) => {
                        const currentRankIndex = rankIndex + (idx - 1); // Adjusts to get the correct rank index for the Before, Current, and After images
                        return (
                            <div key={idx}>
                                <img
                                    className="skipped-rank-image"
                                    src={`data:image/jpeg;base64,${imageData}`}
                                    alt={`Rank ${currentRankIndex} Icon`}
                                />
                                <div className="text-container">
                                    Grade {careerLadder.Ranks[currentRankIndex]?.RankTier.value}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <table className="rank-images-table">
            <tbody>
                {rankColors.map((color, colorIndex) => (
                    <>
                        <tr key={`${colorIndex}-title`}>
                            <td colSpan="15" className="row-title-header">{color}</td>
                        </tr>
                        <tr key={colorIndex} className="rank-row">
                            {Array.from({ length: 15 }, (_, rankIndexWithinColor) => {
                                const isFirstColumn = rankIndexWithinColor === 0;
                                const isLastColumn = rankIndexWithinColor === 14; // assuming you have 15 columns
    
                                // Dynamically determine the class for the tooltip
                                let tooltipClass = "hover-content";
                                if (isFirstColumn) tooltipClass += " first-column-content";
                                if (isLastColumn) tooltipClass += " last-column-content";
                                const rankIndex = colorIndex * 45 + rankIndexWithinColor * 3 + 2;
                                if(rankIndex === 0) return null;
                                const rank = careerLadder.Ranks[rankIndex];
                                const imageData = getRankImageData(rankIndex);
                                const ranksForTooltip = getRankImagesForTooltip(rankIndex).map((_, idx) => rankIndex + (idx - 1));
                                const isCurrentRank = ranksForTooltip.includes(currentRank);
        
                                return (
                                    <td key={rankIndex} className={`rank-cell ${isCurrentRank ? "current-rank" : ""}`}> 
                                        <Tooltip position="bottom" trigger="mouseenter" arrow>
                                            <div className="tooltip-container">  
                                                <div className={tooltipClass}>
                                                    {renderTooltipContent(rankIndex, rank, color)}
                                                </div>
                                                <div className="static-content">
                                                    <div className="text-container"></div>
                                                    <img
                                                        className={`rank-image ${isCurrentRank ? "pulse-animation" : ""}`}
                                                        src={`data:image/jpeg;base64,${imageData}`}
                                                        alt={`Rank ${rankIndex} Icon`}
                                                    />
                                                </div>
                                            </div>
                                        </Tooltip>
                                    </td>
                                );
                            })}
                        </tr>
                    </>
                ))}
            </tbody>
        </table>
    );
    
    
};

export default RankTable;
