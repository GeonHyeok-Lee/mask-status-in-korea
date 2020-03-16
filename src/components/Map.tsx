import React, { useState, useCallback } from "react";
import GoogleMapReact from "google-map-react";
import Store from "./Store";
import styled from "styled-components";
import Information from "./Information";
import Caution from "./Caution";
import MyLocationButton from "./MyLocationButton";
import { GOOGLE_MAP_API } from "../dotenv";
import AddressBar from "./AddressBar";
import { geoCode } from "../utils/geoCode";
import RefreshButton from "./RefreshButton";
import NoticeButton from "./NoticeButton";
import Notice from "./Notice";

type TMapProps = {
  currentLocation:
    | {
        lat: number;
        lng: number;
      }
    | undefined;
  setCurrentLocation: React.Dispatch<
    React.SetStateAction<
      | {
          lat: number;
          lng: number;
        }
      | undefined
    >
  >;
  myLocation:
    | {
        lat: number;
        lng: number;
      }
    | undefined;
  updateStoreData: (lat: number, lng: number, currentZoom: number) => void;
  storeList: any;
  setRefreshLoading: React.Dispatch<React.SetStateAction<boolean>>;
  refreshLoading: boolean;
  currentZoom: number;
  setCurrentZoom: React.Dispatch<React.SetStateAction<number>>;
};

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  div.dummyContainer {
    width: 100%;
    height: 100%;
  }
`;

const UtilWrap = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  margin: 20px;
  display: flex;
  flex-direction: column;
  z-index: 99;
  @media (max-width: 1023px) {
    margin: 10px;
  }
  > div.util-button-wrap {
    display: flex;
    flex-direction: raw;
    > div {
      margin-right: 20px;
      :last-of-type {
        margin-right: 0;
      }
      @media (max-width: 1023px) {
        margin-right: 10px;
        :last-of-type {
          margin-right: 0;
        }
      }
    }
  }
  > div {
    margin-bottom: 20px;
    :last-of-type {
      margin-bottom: 0;
    }
    @media (max-width: 1023px) {
      margin-bottom: 10px;
      :last-of-type {
        margin-bottom: 0;
      }
    }
  }
`;

const InformationWrap = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  margin: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 99;
  @media (max-width: 1023px) {
    margin: 10px;
  }
  > div:nth-child(1) {
    margin-bottom: 20px;
    @media (max-width: 1023px) {
      margin-bottom: 10px;
    }
  }
`;

const Map: React.FC<TMapProps> = ({
  currentLocation,
  setCurrentLocation,
  myLocation,
  storeList,
  updateStoreData,
  refreshLoading,
  setRefreshLoading,
  currentZoom,
  setCurrentZoom
}) => {
  const [currentHoverStore, setCurrentHoverStore] = useState<number>();
  const [currentClickStore, setCurrentClickStore] = useState<number>();
  const [address, setAddress] = useState<string>("");
  const [toggleNotice, setToggleNotice] = useState<boolean>(false);

  const initialEvent = useCallback(
    (hover: boolean = true, click: boolean = true) => {
      if (hover) {
        setCurrentHoverStore(-999999);
      }
      if (click) {
        setCurrentClickStore(-999999);
      }
    },
    []
  );

  const onMouseOverStore = useCallback(
    (code: number) => {
      if (code !== currentClickStore) {
        initialEvent(false);
      } else {
        initialEvent(true, false);
      }
      setCurrentHoverStore(code);
    },
    [currentClickStore, initialEvent]
  );

  const onChangeMap = useCallback(
    async ({ center }) => {
      setCurrentLocation(prev => ({
        ...prev,
        lat: center.lat,
        lng: center.lng
      }));
      updateStoreData(center.lat, center.lng, currentZoom);
    },
    [currentZoom, setCurrentLocation, updateStoreData]
  );

  const onZoomAnimationEnd = useCallback(
    (zoom: number) => {
      setCurrentZoom(zoom);
    },
    [setCurrentZoom]
  );

  const onClickStore = useCallback(
    (lat: number, lng: number, code: number) => {
      initialEvent();
      setCurrentLocation(prev => ({
        ...prev,
        lat,
        lng
      }));
      if (currentClickStore === code) {
        setCurrentClickStore(-999999);
      } else {
        setCurrentClickStore(code);
      }
      setCurrentZoom(16);
    },
    [currentClickStore, initialEvent, setCurrentLocation, setCurrentZoom]
  );

  const onMoveMyLocation = useCallback(() => {
    initialEvent();
    if (!myLocation) return;
    setCurrentLocation(prev => ({
      ...prev,
      lat: myLocation.lat,
      lng: myLocation.lng
    }));
    setCurrentZoom(16);
  }, [initialEvent, myLocation, setCurrentLocation, setCurrentZoom]);

  const onSubmitAddress = useCallback(
    async (address: string) => {
      const result = await geoCode(address);
      setCurrentLocation(prev => ({
        ...prev,
        lat: result.lat,
        lng: result.lng
      }));
      setCurrentZoom(16);
      setAddress("");
    },
    [setCurrentLocation, setCurrentZoom]
  );

  const onRefreshStoreData = useCallback(() => {
    if (currentLocation) {
      updateStoreData(currentLocation.lat, currentLocation.lng, currentZoom);
    }
  }, [currentLocation, currentZoom, updateStoreData]);

  const onToggleNotice = useCallback((trigger: boolean) => {
    setToggleNotice(trigger);
  }, []);

  return (
    <>
      <Container>
        <GoogleMapReact
          bootstrapURLKeys={{ key: GOOGLE_MAP_API }}
          center={currentLocation}
          zoom={currentZoom}
          onChange={onChangeMap}
          onZoomAnimationEnd={onZoomAnimationEnd}
          onClick={() => initialEvent()}
          onDrag={() => setRefreshLoading(true)}
          onDragEnd={() => initialEvent()}
        >
          {storeList &&
            currentZoom >= 13 &&
            storeList.map((store: any) => (
              <Store
                key={store.code}
                lat={store.lat}
                lng={store.lng}
                currentZoom={currentZoom}
                storeData={store}
                onCurrentHover={store.code !== currentHoverStore ? false : true}
                onCurrentClick={store.code !== currentClickStore ? false : true}
                onMouseOverStore={onMouseOverStore}
                initialEvent={initialEvent}
                onClickStore={onClickStore}
              />
            ))}
        </GoogleMapReact>
        <UtilWrap>
          <AddressBar
            onSubmitAddress={onSubmitAddress}
            address={address}
            setAddress={setAddress}
          />
          <div className="util-button-wrap">
            <MyLocationButton onMoveMyLocation={onMoveMyLocation} />
            <RefreshButton
              onRefreshStoreData={onRefreshStoreData}
              spin={refreshLoading ? true : false}
            />
          </div>
        </UtilWrap>
        <InformationWrap>
          <NoticeButton onToggleNotice={onToggleNotice} />
          <Information />
        </InformationWrap>
      </Container>
      {currentZoom < 13 && <Caution />}
      {toggleNotice && <Notice onToggleNotice={onToggleNotice} />}
    </>
  );
};

export default React.memo(Map);
