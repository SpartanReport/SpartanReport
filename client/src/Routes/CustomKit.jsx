import React, { useEffect, useState } from 'react';
import "../Styles/Home.css";
import axios from "axios";
import { useParams } from "react-router-dom";
import SvgBorderWrapper from "../Styles/Border";
import ObjectCard from "./ObjectCard";
import LoadingScreen from "../Components/Loading";

function renderEquippedItem(onObjectClick, item, gamerInfo, highlightedItems) {
    if (!item.id) {
        return null;
    }
    const isHighlighted = highlightedItems[item.id] || false;
    if (gamerInfo == null) {
        return (
            <SvgBorderWrapper className="scaled-object-card" height={200} width={200} rarity={item.Rarity}>
                <ObjectCard
                    key={item.id}
                    object={item}
                    gamerInfo=""
                    onClick={() => onObjectClick(item, gamerInfo)}
                />
            </SvgBorderWrapper>
        );
    }
    return (
        <SvgBorderWrapper className="scaled-object-card" height={200} width={200} rarity={item.Rarity}>
            <ObjectCard
                key={item.id}
                object={item}
                gamerInfo={gamerInfo}
                isHighlighted={isHighlighted}
                onClick={() => onObjectClick(item, gamerInfo)}
            />
        </SvgBorderWrapper>
    );
}

function CustomKit({ gamerInfo }) {
    const { kitId, xuid } = useParams();
    const [kit, setKit] = useState({});
    const [kitCheck, setKitCheck] = useState({});
    const [deletedItems, setDeletedItems] = useState({}); // State for storing "deleted" items
    const [highlightedItems, setHighlightedItems] = useState({});
    const [isLoading, setIsLoading] = useState(true); // State to track loading status
    useEffect(() => {
        const fetchKit = async () => {
            setIsLoading(true); // Start loading
            try {
                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
                const response = await axios.get(`${apiUrl}/customkit/${kitId}/${xuid}`);
                response.data.CurrentlyEquipped.CurrentlyEquippedCore.isHighlighted = false;
                response.data.CurrentlyEquipped.CurrentlyEquippedHelmet.isHighlighted = false;
                response.data.CurrentlyEquipped.CurrentlyEquippedVisor.isHighlighted = false;
                response.data.CurrentlyEquipped.CurrentlyEquippedGlove.isHighlighted = false;
                response.data.CurrentlyEquipped.CurrentlyEquippedCoating.isHighlighted = false;
                response.data.CurrentlyEquipped.CurrentlyEquippedLeftShoulderPad.isHighlighted = false;
                response.data.CurrentlyEquipped.CurrentlyEquippedRightShoulderPad.isHighlighted = false;
                response.data.CurrentlyEquipped.CurrentlyEquippedWristAttachment.isHighlighted = false;
                response.data.CurrentlyEquipped.CurrentlyEquippedChestAttachment.isHighlighted = false;
                response.data.CurrentlyEquipped.CurrentlyEquippedKneePad.isHighlighted = false;
                response.data.CurrentlyEquipped.CurrentlyEquippedHipAttachment.isHighlighted = false;
                response.data.CurrentlyEquipped.CurrentlyEquippedArmorMythicFx.isHighlighted = false;
                response.data.CurrentlyEquipped.CurrentlyEquippedArmorFx.isHighlighted = false;

                setKit(response.data);

                if (response.data && gamerInfo != null) {
                    const payload = {
                        gamerInfo,
                        currentlyEquippedItems: response.data.CurrentlyEquipped,
                    };
                    const spartanResponse = await axios.post(`${apiUrl}/customkitcheck`, payload);
                    setKitCheck(spartanResponse.data);
                }
            } catch (error) {
                console.error("Error fetching Spartan inventory:", error);
            } finally {
                setIsLoading(false); // End loading regardless of the outcome
            }
        };
        fetchKit();
    }, [kitId, xuid, gamerInfo]);

    useEffect(() => {
        if (Object.keys(kitCheck).length > 0 && Object.keys(kit).length > 0) {
            let newKit = { ...kit };
            let newDeletedItems = { ...deletedItems }; // Copy of the current deletedItems
            let changesMade = false;

            const checkAndDelete = (check, key) => {
                if (check !== true && newKit.CurrentlyEquipped?.[key] && newKit.CurrentlyEquipped[key].id) {

                    newDeletedItems[key] = newKit.CurrentlyEquipped[key]; // Move to deletedItems
                    delete newKit.CurrentlyEquipped[key];
                    changesMade = true;
                }
            };
            console.log("kit check: ", kitCheck)
            console.log("kit: ", kit)
            checkAndDelete(kitCheck.HelmetCheck, 'CurrentlyEquippedHelmet');
            checkAndDelete(kitCheck.VisorCheck, 'CurrentlyEquippedVisor');
            checkAndDelete(kitCheck.GloveCheck, 'CurrentlyEquippedGlove');
            checkAndDelete(kitCheck.CoatingCheck, 'CurrentlyEquippedCoating');
            checkAndDelete(kitCheck.ArmorFxCheck, 'CurrentlyEquippedArmorFx');
            checkAndDelete(kitCheck.LeftShoulderPadCheck, 'CurrentlyEquippedLeftShoulderPad');
            checkAndDelete(kitCheck.RightShoulderPadCheck, 'CurrentlyEquippedRightShoulderPad');
            checkAndDelete(kitCheck.HipAttachmentCheck, 'CurrentlyEquippedHipAttachment');
            checkAndDelete(kitCheck.MythicFxCheck, 'CurrentlyEquippedArmorMythicFx');
            checkAndDelete(kitCheck.KneePadCheck, 'CurrentlyEquippedKneePad');
            checkAndDelete(kitCheck.WristAttachmentCheck, 'CurrentlyEquippedWristAttachment');
            checkAndDelete(kitCheck.ChestAttachmentCheck, 'CurrentlyEquippedChestAttachment');

            if (changesMade) {
                setKit(newKit);
                setDeletedItems(newDeletedItems); // Update the deletedItems state
            }
        }
    }, [kitCheck, kit, deletedItems]);
    let onClickOwned = (object, gamerInfo) => {
        if (!gamerInfo) {
            console.log("not authenticated");
        }else{
            handleObjectClick(object);
        }
        console.log("clicked owned");
    };

    const sendEquip = async (gamerInfo, currentlyEquipped) => {
        if (currentlyEquipped.CurrentlyEquippedCore.GetInv === true) {
            currentlyEquipped.CurrentlyEquippedHelmet = null;
            currentlyEquipped.CurrentlyEquippedVisor = null;
            currentlyEquipped.CurrentlyEquippedGlove = null;
            currentlyEquipped.CurrentlyEquippedCoating = null;
            currentlyEquipped.CurrentlyEquippedLeftShoulderPad = null;
            currentlyEquipped.CurrentlyEquippedRightShoulderPad = null;
            currentlyEquipped.CurrentlyEquippedWristAttachment = null;
            currentlyEquipped.CurrentlyEquippedChestAttachment = null;
            currentlyEquipped.CurrentlyEquippedKneePad = null;
            currentlyEquipped.CurrentlyEquippedHipAttachment = null;
            currentlyEquipped.CurrentlyEquippedKit = null;
            currentlyEquipped.CurrentlyEquippedKitCustom = null;
            currentlyEquipped.CurrentlyEquippedArmorMythicFx = null;
            currentlyEquipped.CurrentlyEquippedArmorFx = null;
            currentlyEquipped.CurrentlyEquippedArmorEmblem = null;


        }
        const payload = {
            GamerInfo: gamerInfo,
            CurrentlyEquipped: currentlyEquipped
        };
        console.log("Sending equip payload to backend", payload)
        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';

            const response = await fetch(`${apiUrl}/armorcore`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data
        } catch (error) {
            console.error('There was an error!', error);
        }
    };

    const handleObjectClick = async (object) => {
        console.log("clicked object!!!!")
        // If the object is not highlighted
        setHighlightedItems(prevState => ({
            ...prevState,
            [object.id]: true, // Set the clicked object's highlighted status to true
        }));
        // Sends newly equipped item back to parent Component
        let dataToSend = {CurrentlyEquippedCore: kit.CurrentlyEquipped.CurrentlyEquippedCore};
        // Search what type the object being clicked on is. For most cases, it will send the currently equipped items with the compatable type.
        // If the object is a core, it will equip that core, send a request to the backend to see what items are equipped currently for that core
        // and then send those items back to the parent component, and highlight the items that are equipped, and reset the highlight for the core
        if (object.Type === "ArmorHelmet") {
            console.log("Datatosend: ", dataToSend)
            dataToSend.CurrentlyEquippedCore.GetInv = false;
            dataToSend.CurrentlyEquippedHelmet = object;
            await sendEquip(gamerInfo, dataToSend);
        } else if (object.Type === "ArmorCore") {
            dataToSend.CurrentlyEquippedCore = object;
            dataToSend.CurrentlyEquippedCore.GetInv = true;
            await sendEquip(gamerInfo, dataToSend);
        } else if (object.Type === "ArmorVisor") {
            dataToSend.CurrentlyEquippedCore.GetInv = false;
            dataToSend.CurrentlyEquippedVisor = object;
            await sendEquip(gamerInfo, dataToSend);
        } else if (object.Type === "ArmorGlove") {
            dataToSend.CurrentlyEquippedCore.GetInv = false;
            dataToSend.CurrentlyEquippedGlove = object;
            await sendEquip(gamerInfo, dataToSend);
        } else if (object.Type === "ArmorCoating") {
            dataToSend.CurrentlyEquippedCore.GetInv = false;
            dataToSend.currentlyEquippedCoating = object;
            await sendEquip(gamerInfo, dataToSend);
        } else if (object.Type === "ArmorLeftShoulderPad") {
            dataToSend.CurrentlyEquippedCore.GetInv = false;
            dataToSend.CurrentlyEquippedLeftShoulderPad = object;
            await sendEquip(gamerInfo, dataToSend);
        } else if (object.Type === "ArmorRightShoulderPad") {
            dataToSend.CurrentlyEquippedCore.GetInv = false;
            dataToSend.CurrentlyEquippedRightShoulderPad = object;
            await sendEquip(gamerInfo, dataToSend);
        }
        else if (object.Type === "ArmorWristAttachment") {
            dataToSend.CurrentlyEquippedCore.GetInv = false;
            dataToSend.CurrentlyEquippedWristAttachment = object;
            await sendEquip(gamerInfo, dataToSend);
        }
        else if (object.Type === "ArmorHipAttachment") {
            dataToSend.CurrentlyEquippedCore.GetInv = false;
            dataToSend.CurrentlyEquippedHipAttachment = object;
            await sendEquip(gamerInfo, dataToSend);
        }
        else if (object.Type === "ArmorChestAttachment") {
            dataToSend.CurrentlyEquippedCore.GetInv = false;
            dataToSend.CurrentlyEquippedChestAttachment = object;
            await sendEquip(gamerInfo, dataToSend);
        }
        else if (object.Type === "ArmorKneePad") {
            dataToSend.CurrentlyEquippedCore.GetInv = false;
            dataToSend.CurrentlyEquippedKneePad = object;
            await sendEquip(gamerInfo, dataToSend);
        }
        else if (object.Type === "ArmorMythicFx") {
            dataToSend.CurrentlyEquippedCore.GetInv = false;
            dataToSend.CurrentlyEquippedArmorMythicFx = object;
            await sendEquip(gamerInfo, dataToSend);
        }
        else if (object.Type === "ArmorFx") {
            dataToSend.CurrentlyEquippedCore.GetInv = false;
            dataToSend.CurrentlyEquippedArmorFx = object;
            await sendEquip(gamerInfo, dataToSend);
        }
    };

    const handleEquipAll = async () => {
        console.log("Equipping all")
        let dataToSend = {...kit.CurrentlyEquipped};
        // for each item in kit.CurrentlyEquipped, set the element isHighlighted = false
        const newHighlightedItems = {};
        Object.keys(dataToSend).forEach(key => {
            // Assuming each item has an id property
            if (dataToSend[key] && dataToSend[key].id) {
                newHighlightedItems[dataToSend[key].id] = true;
            }
        });

        setHighlightedItems(newHighlightedItems); // Update the highlighted items state

        await sendEquip(gamerInfo, dataToSend);


    }
    const handleEquipAllRouteToArmory = async () => {
        console.log("Equipping all")
        let dataToSend = {...kit.CurrentlyEquipped};
        await sendEquip(gamerInfo, dataToSend);
        window.location.href = "/spartan"


    }

    const onClickNotOwned = () => {
        console.log("clicked not owned")
    }
    const renderEditingDetails = (items, gamerInfo, subheaderTitle, onClick) => {
        return (
            <div className="editing-details-kit-page">
                <div className="subheader-container-edit">
                    <svg className="diamond-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.92 22.92">
                        <path className="cls-1"
                              d="M11.46,0L0,11.46l11.46,11.46,11.46-11.46L11.46,0ZM3.41,11.46L11.46,3.41l8.05,8.05-8.05,8.05L3.41,11.46Z"/>
                        <rect className="cls-1" x="8.16" y="8.16" width="6.59" height="6.59"
                              transform="translate(-4.75 11.46) rotate(-45)"/>
                    </svg>
                    {gamerInfo ? (<h1 className="spartan-subheader-home"> {subheaderTitle}</h1>) : (
                        <h1 className="spartan-subheader-home"> Pieces</h1>)}
                </div>
                <div >
                    {gamerInfo  && subheaderTitle != "Not Owned"? (<button className="nav-button" style={{margin: '10px'}} onClick={handleEquipAll} > Equip All</button>): null}
                    {gamerInfo && subheaderTitle != "Not Owned" ? (<button className="nav-button" onClick={handleEquipAllRouteToArmory} > Equip All & Go To Armory</button>): null}

                </div>

                <div className="scrollable-container-kit-page">
                    {Object.values(items || {}).map(item =>
                        (item && (item === items.CurrentlyEquippedArmorEmblem || item.CorePath || item.Type === "ArmorCore")) ?
                            renderEquippedItem(onClick,item, gamerInfo,highlightedItems) : null
                    )}
                </div>
            </div>
        );
    };
    console.log("deleted items: ", deletedItems)

    if (isLoading) {
        return <LoadingScreen />;

    }
    return (
        <div className="home-grid-container">
            <div className="title-container-donate">
                <h1 className="spartan-title-home">{kit.Image} - {kit.Name}</h1>
            </div>
            <div>
                {renderEditingDetails(kit.CurrentlyEquipped || {}, gamerInfo, "Available To Equip",onClickOwned)}
                {Object.keys(deletedItems).length > 0 && (
                    <div>
                        {renderEditingDetails(deletedItems, gamerInfo,"Not Owned", onClickNotOwned)}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CustomKit;