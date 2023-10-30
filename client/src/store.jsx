import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./styles.css"
import "./store.css"

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


    return (
        <div>
            <h1 className="ops-title">Store</h1>
            <div className="offerings-container">
                {storeData && storeData.Offerings
                    .sort((a, b) => (b.OfferingDetails.HeightHint * b.OfferingDetails.WidthHint) - (a.OfferingDetails.HeightHint * a.OfferingDetails.WidthHint))
                    .map((offering, index) => {
                        const height = offering.OfferingDetails.HeightHint;
                        const width = offering.OfferingDetails.WidthHint;
                        const dynamicStyle = {
                            height: `${height * baseDimension}px`,
                            width: `${width * baseDimension}px`,
                            background: 'white'
                        };
                        return (
                            <div key={index} className="offering" style={dynamicStyle}>
                                <h2>{offering.OfferingID}</h2>
                                <p>Title: {offering.OfferingDetails.Title}</p>
                                <p>Image Path: {offering.OfferingDetails.ObjectImagePath}</p>
                                <p>Height Hint: {offering.OfferingDetails.HeightHint}</p>
                                <p>Width Hint: {offering.OfferingDetails.WidthHint}</p>
                            </div>
                        );
                    })
                }
            </div>
        </div>
    );
};


export default Store;
