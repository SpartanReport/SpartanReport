import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../Styles/styles.css"
import "../Styles/store.css"
import SvgBorderWrapper from '../Styles/Border';
import LoadingScreen from '../Components/Loading';



const Store = ({ gamerInfo }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [storeData, setStoreData] = useState(null);

    useEffect(() => {
        const fetchStore = async () => {
            try {
                // Use gamerInfo in the Axios POST request
                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080'; // Fallback URL if the env variable is not set
                const response = await axios.post(`${apiUrl}/store`, gamerInfo || {});
                console.log("response: ",response);

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
        return <LoadingScreen />;
    }

    const baseDimension = 100; // 100 pixels, or whatever base dimension you prefer

    const is2x2Tile = offering => offering.OfferingDetails.HeightHint === 2 && offering.OfferingDetails.WidthHint === 2;
    const is1x2Tile = offering => offering.OfferingDetails.HeightHint === 1 && offering.OfferingDetails.WidthHint === 2;
    function ShopImage(base64ImageData){
        console.log("base64ImageData: ",base64ImageData)
        if (base64ImageData === ""){
            return null;
        }
        return `data:image/png;base64,${base64ImageData}`;
    }
    const renderOffering = (offering, index, isSpecialOffering=false) => {
        if (offering.OfferingDetails.HeightHint === 1){
            offering.OfferingDetails.HeightHint = 2;
            offering.OfferingDetails.WidthHint = 3;

        }
        const dynamicStyle = {
            height: `${offering.OfferingDetails.HeightHint * baseDimension}px`,
            heightInt: offering.OfferingDetails.HeightHint * baseDimension,
            width: `${offering.OfferingDetails.WidthHint * baseDimension}px`,
            widthInt: offering.OfferingDetails.WidthHint * baseDimension,
        };
        let cardClassName;
        if (!isSpecialOffering){
             cardClassName = ` cardWithGradient-store ${offering.OfferingDetails.Quality}`;

        }else{
            cardClassName = ``;

        }
        const imageSrc = ShopImage(offering.OfferingDetails.OfferingImage);
        const name = offering.OfferingDetails.Title.value;
        const price = offering.Prices.length > 0 ? `${offering.Prices[0].Cost}` : '';
        if (imageSrc === null){
            return null;
        }
        
        return (
            <SvgBorderWrapper height={dynamicStyle.heightInt} width={dynamicStyle.widthInt} rarity={offering.OfferingDetails.Quality}>
                <div key={index} className={cardClassName}>
                <div>
                    <div>
                        <p className='card-subheader-mini-store'>{name}</p>
                        <p className='card-subheader-mini-store'>{price} cR</p>
                        <img
                            className="offering-img"
                            src={imageSrc}
                            alt="Shop Logo"
                            style={{ 
                                height: `${dynamicStyle.heightInt-50}px`,
                                width: `${dynamicStyle.widthInt-15}px`,
                                }}
                        />
                    </div>
                </div>
                </div> 
            </SvgBorderWrapper>
         );
    };
    
    storeData.Offerings.sort((a, b) => (b.OfferingDetails.HeightHint * b.OfferingDetails.WidthHint) - (a.OfferingDetails.HeightHint * a.OfferingDetails.WidthHint));
    const renderOfferings = () => {
        let renderedOfferings = [];
        let gridLength = 0; // this keeps track of the total grid length used
    
        const maxGridLength = 14;
        const resetGridLength = () => gridLength = 0;
    
        // Define functions to identify 2x2, 1x1, 2x3, and special tiles
        const is2x2Tile = offering => offering.OfferingDetails.HeightHint === 2 && offering.OfferingDetails.WidthHint === 2;
        const is1x1Tile = offering => offering.OfferingDetails.HeightHint === 1 && offering.OfferingDetails.WidthHint === 1;
        const is2x3Tile = offering => offering.OfferingDetails.HeightHint === 2 && offering.OfferingDetails.WidthHint === 3;
        const specialTitles = ["VIEW BATTLE PASSES", "HCS OFFERS"];
    
        // Filter out offerings by type
        const specialOfferings = storeData.Offerings.filter(offering => specialTitles.includes(offering.OfferingDetails.Title.value));
        const twoByTwoOfferings = storeData.Offerings.filter(is2x2Tile);
        const twoByThreeOfferings = storeData.Offerings.filter(is2x3Tile);
        const oneByOneOfferings = storeData.Offerings.filter(is1x1Tile);
        const otherOfferings = storeData.Offerings.filter(offering => 
            !specialTitles.includes(offering.OfferingDetails.Title.value) && 
            !is2x2Tile(offering) && 
            !is1x1Tile(offering) && 
            !is2x3Tile(offering)
        );
    
        // Render special offerings first using special-offering-stack
        if (specialOfferings.length > 0) {
            renderedOfferings.push(
                <div className="special-offering-stack" key="special-stack">
                    {specialOfferings.map((offering, index) => renderOffering(offering, index))}
                </div>
            );
        }
    
        // Render larger non-special offerings
        otherOfferings.forEach((offering, index) => {
            renderedOfferings.push(renderOffering(offering, index));
        });
    
        // Render 2x3 offerings using a similar stacking approach
        if (twoByThreeOfferings.length > 0) {
            renderedOfferings.push(
                <div className="two-by-three-offering-stack" key="two-by-three-stack">
                    {twoByThreeOfferings.map((offering, index) => renderOffering(offering, index))}
                </div>
            );
        }
    
        // Render 2x2 offerings
        twoByTwoOfferings.forEach((offering, index) => {
            if (!specialTitles.includes(offering.OfferingDetails.Title.value)){
                renderedOfferings.push(renderOffering(offering, index));
            }
        });
    
        // Render 1x1 offerings last
        oneByOneOfferings.forEach((offering, index) => {
                renderedOfferings.push(renderOffering(offering, index));
        });
    
        return renderedOfferings;
    };
    
    
    
    
    
    return (
        <div className="home-grid-container">
            <div className="title-container-home">
            <h1 className="spartan-title-home">STORE (Preview)</h1>
            </div>
              <div className="offerings-container">
                {renderOfferings()}
            </div>
        </div>
    );
};


export default Store;
