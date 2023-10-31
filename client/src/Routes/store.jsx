import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../Styles/styles.css"
import "../Styles/store.css"

const Store = ({ gamerInfo }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [storeData, setStoreData] = useState(null);

    useEffect(() => {
        const fetchStore = async () => {
            try {
                const response = await axios.post('http://localhost:8080/store', gamerInfo);
                setStoreData(response.data.StoreData); // assuming the data is under response.data.StoreData
                console.log(response);
            } catch (error) {
                console.error("Error fetching Spartan inventory:", error);
            }
            setIsLoading(false);
        };
        
        fetchStore();
    }, [gamerInfo]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    const baseDimension = 100; // 100 pixels, or whatever base dimension you prefer

    const is2x2Tile = offering => offering.OfferingDetails.HeightHint === 2 && offering.OfferingDetails.WidthHint === 2;
    const is1x2Tile = offering => offering.OfferingDetails.HeightHint === 1 && offering.OfferingDetails.WidthHint === 2;
    function ShopImage(base64ImageData){
        return `data:image/png;base64,${base64ImageData}`;
    }
    const renderOffering = (offering, index) => {
        if (offering.OfferingDetails.HeightHint === 1){
            offering.OfferingDetails.HeightHint = 2;
        }
        const dynamicStyle = {
            height: `${offering.OfferingDetails.HeightHint * baseDimension}px`,
            width: `${offering.OfferingDetails.WidthHint * baseDimension}px`,
        };
        if (offering.IncludedItems.length === 0){
            return (
                <div key={index} className="offering" style={dynamicStyle}>
                    <h3 className='offering-title'>{offering.OfferingDetails.Title.value}</h3>
                    <img className="offering-img" src={ShopImage(offering.OfferingDetails.OfferingImage)} alt="Shop Logo" />
                </div>
            );
        }
        if (offering.OfferingDetails.HeightHint === 2 && offering.OfferingDetails.WidthHint === 2){
            return (
                <div key={index} className="offering" style={dynamicStyle}>
                    <h3 className='offering-title'>{offering.OfferingDetails.Title.value}</h3>
                    <img className="offering-img" src={ShopImage(offering.OfferingDetails.OfferingImage)} alt="Shop Logo" />
                    <p className='offer-footer-2x2'>Items: {offering.IncludedItems.length} Price: {offering.Prices[0].Cost}</p>
                </div>
            );
        }

        return (
            <div key={index} className="offering" style={dynamicStyle}>
                <h3 className='offering-title'>{offering.OfferingDetails.Title.value}</h3>
                <img className="offering-img" src={ShopImage(offering.OfferingDetails.OfferingImage)} alt="Shop Logo" />
                <p className='offer-footer'>Items: {offering.IncludedItems.length} Price: {offering.Prices[0].Cost}</p>
            </div>
        );
    };
    storeData.Offerings.sort((a, b) => (b.OfferingDetails.HeightHint * b.OfferingDetails.WidthHint) - (a.OfferingDetails.HeightHint * a.OfferingDetails.WidthHint));
    const renderOfferings = () => {
        let renderedOfferings = [];
        let gridLength = 0;  // this keeps track of the total grid length used
    
        const maxGridLength = 14;
        const resetGridLength = () => gridLength = 0;
    
        // Separate the special titles
        const specialTitles = ["VIEW BATTLE PASSES", "HCS OFFERS"];
        const specialOfferings = storeData.Offerings.filter(offering => 
            specialTitles.includes(offering.OfferingDetails.Title.value)
        );
        const otherOfferings = storeData.Offerings.filter(offering => 
            !specialTitles.includes(offering.OfferingDetails.Title.value)
        );
    
        // Create a container for the special titles to stack them vertically
        const specialOfferingsContainer = specialOfferings.map(offering =>
        renderOffering(offering));
        renderedOfferings.push(
            <div className="special-offering-container" key="special-container">
                {specialOfferingsContainer}
            </div>
        );
    
        // Now, calculate the gridLength used by these special offerings to avoid overlapping
        specialOfferings.forEach(offering => {
            gridLength += offering.OfferingDetails.HeightHint;
        });
    
        // Render the rest of the offerings
        for (let i = 0; i < otherOfferings.length; i++) {
            const offering = otherOfferings[i];
    
            if (gridLength + offering.OfferingDetails.HeightHint > maxGridLength) {
                resetGridLength();
            }
    
            if (is2x2Tile(offering) || is1x2Tile(offering)) {
                if (i + 1 < otherOfferings.length && (is2x2Tile(otherOfferings[i + 1]) || is1x2Tile(otherOfferings[i + 1]))) {
                    renderedOfferings.push(
                        <div className="offering-row" key={i}>
                            {renderOffering(offering, i)}
                            {renderOffering(otherOfferings[i + 1], i + 1)}
                        </div>
                    );
                    gridLength += offering.OfferingDetails.HeightHint;
                    gridLength += otherOfferings[i + 1].OfferingDetails.HeightHint;
                    i++;  // increment to skip the next offering
                } else {
                    renderedOfferings.push(renderOffering(offering, i));
                    gridLength += offering.OfferingDetails.HeightHint;
                }
            } else {
                renderedOfferings.push(renderOffering(offering, i));
                gridLength += offering.OfferingDetails.HeightHint;
            }
        }
    
        return renderedOfferings;
    };
    
    return (
        <div>
            <h1 className="ops-title">Store</h1>
            <div className="offerings-container">
                {renderOfferings()}
            </div>
        </div>
    );
};


export default Store;
