import React from 'react';
import 'tippy.js/dist/tippy.css'; // This can be removed if tooltips are no longer used anywhere else
import "../Styles/RankTable.css";

const RankTable = ({ rankImages, careerLadder }) => {
    if (!careerLadder || !careerLadder.Ranks) {
        return null;
    }

    // Convert rankImages to an array and filter out the first two ranks
    const filteredRankImages = Object.entries(rankImages)
        .filter(([rankIndex, rankObj]) => rankObj.Rank > 0)
        .sort(([rankIndexA, rankObjA], [rankIndexB, rankObjB]) => rankObjA.Rank - rankObjB.Rank); // Ensure it's sorted by Rank if necessary

    // Define a new method to render all ranks in a grid layout
    const renderRankImagesGrid = () => {
        const ranksPerRow = 15; // Number of images per row
        const totalRanks = filteredRankImages.length; // Total number of ranks after filtering
        const numberOfRows = Math.ceil(totalRanks / ranksPerRow); // Calculate the number of rows needed

        return Array.from({ length: numberOfRows }, (_, rowIndex) => {
            const startRankIndex = rowIndex * ranksPerRow;
            const endRankIndex = Math.min(startRankIndex + ranksPerRow, totalRanks);

            return (
                <tr key={`row-${rowIndex}`}>
                    {filteredRankImages.slice(startRankIndex, endRankIndex).map(([rankIndex, rankObj], index) => {
                        return (
                            <td key={`rank-${rankIndex}`} className="rank-cell">
                                <img
                                    className="rank-image"
                                    src={`data:image/jpeg;base64,${rankObj.Image}`}
                                    alt={`Rank ${rankObj.Rank} Icon`}
                                />
                            </td>
                        );
                    })}
                </tr>
            );
        });
    };

    return (
        <table className="rank-images-table">
            <tbody>
                {renderRankImagesGrid()}
            </tbody>
        </table>
    );
};

export default RankTable;
