import React, { useState } from 'react';
import { Tooltip } from 'react-tippy';
import 'tippy.js/dist/tippy.css'; // don't forget the CSS
import "./RankTable.css";

const RankTable = ({ rankImages, careerLadder }) => {
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

    const getRelativePosition = (index) => {
        if(index === 0) return 'Before';
        else if(index === 1) return 'Current';
        else if(index === 2) return 'After';
        else return '';
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
                    <tr key={colorIndex}>
                        {Array.from({ length: 15 }, (_, rankIndexWithinColor) => {
                            const rankIndex = colorIndex * 45 + rankIndexWithinColor * 3 + 2; // Revert back to +1
                            if(rankIndex === 0) return null; // This will skip the first rank and won't render anything for it
                            const rank = careerLadder.Ranks[rankIndex];
                            const imageData = getRankImageData(rankIndex);
                            return (
                                <td key={rankIndex}>
<Tooltip position="bottom" trigger="mouseenter" arrow>
    <div className="tooltip-container"> {/* A wrapper div for the tooltip content */}
        <div className="hover-content"> {/* This will show only when hovered */}
            {renderTooltipContent(rankIndex, rank, color)}
        </div>
        <div className="static-content"> {/* This will always show */}
        <div className="text-container">
</div>
            <img
                className="rank-image"
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
                ))}
            </tbody>
        </table>
    );
    
};

export default RankTable;
