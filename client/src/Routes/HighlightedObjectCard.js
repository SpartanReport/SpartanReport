// HighlightedObjectCard is the individual card rendered for each armor piece in the Armory Row when it is highlighted
import {useEffect, useState} from "react";
import SvgBorderWrapper from "../Styles/Border";
import fetchImage from "./ProxyFetchImage";

/**
 * Renders a highlighted object card component.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.gamerInfo - The gamer information.
 * @param {Object} props.object - The armor piece information.
 * @param {boolean} props.isDisplay - Indicates whether the card is being displayed.
 * @returns {JSX.Element} The rendered highlighted armor piece card component.
 */
const HighlightedObjectCard = ({ gamerInfo, object, isDisplay }) => {
    let [imageSrc, setImageSrc] = useState('');

    useEffect(() => {
        async function loadImage() {
            if (object.Type === "ArmorCore") {
                const imgSrc = await fetchImage("hi/images/file/" + object.CorePath, gamerInfo.spartankey);
                if (imgSrc === null || imgSrc === undefined){
                    console.log("is null")
                    return;
                }
                setImageSrc(imgSrc);

            }else if (object.ImagePath && gamerInfo.spartankey && isDisplay && object.Type !== "ArmorCore") {
                let url = "hi/images/file/" + object.ImagePath;
                const imgSrc = await fetchImage(url, gamerInfo.spartankey);
                setImageSrc(imgSrc);
            }
            else {
                setImageSrc(`data:image/png;base64,${object.Image}`);
            }
        }
        loadImage();
    }, [object.id, object.ImagePath, object.Image, gamerInfo.spartankey, isDisplay]);
    if (object.Type === "ArmorKitCustom"){
        return
    }
    const rarityClass = object.Rarity;
    const cardClassName = `highlightedObjectCard cardWithGradient ${rarityClass}`;
    return (
        <SvgBorderWrapper height={410} width={410} rarity="Highlight">
            <div className={cardClassName}>
                <p className='card-subheader'>Equipped | {object.name} | {object.Rarity}</p>
                <img src={imageSrc} alt="Spartan Core" className="bigHighlightedImage HighlightedImageCard" />
            </div>
        </SvgBorderWrapper>
    );
};
export default HighlightedObjectCard;
