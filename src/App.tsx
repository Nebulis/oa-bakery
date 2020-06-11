import React, { useEffect, useState } from "react";
import Dropzone from "react-dropzone";
import { v2, WrappedDocument } from "@govtechsg/open-attestation";
import { isValid, VerificationFragment, verify } from "@govtechsg/oa-verify";
import { DocumentValidIcon } from "./DocumentValidIcon";
// @ts-ignore
import png from "png-itxt/browser";

const keyword = "open-attestation";

export const App: React.FunctionComponent = () => {
  // for baking
  const [imageFile, setImageFile] = useState<File>();
  const [imageFileUrl, setImageFileUrl] = useState<string>();
  const [oaFile, setOaFile] = useState<WrappedDocument<v2.OpenAttestationDocument>>();
  const [fragments, setFragments] = useState<VerificationFragment[]>([]);
  const [bakedImage, setBakedImage] = useState("");
  const oaFileValid = fragments.length > 0 && isValid(fragments);
  const bake = () => {
    const reader = new FileReader();
    reader.onload = function () {
      png.set(reader.result, { type: "iTXt", keyword, value: JSON.stringify(oaFile) }, (result: any) => {
        setBakedImage("data:image/png;base64," + btoa(result));
      });
    };
    // @ts-ignore
    reader.readAsBinaryString(imageFile);
  };

  useEffect(() => {
    if (oaFile) {
      const run = async () => {
        setFragments(await verify(oaFile, { network: "ropsten" }));
      };
      run();
    }
  }, [oaFile]);

  // for verifying
  const [vimageFileUrl, setVImageFileUrl] = useState<string>();
  const [voaFile, setVOaFile] = useState<WrappedDocument<v2.OpenAttestationDocument>>();
  const [vfragments, setVFragments] = useState<VerificationFragment[]>([]);

  return (
    <div>
      <h1 className="text-center font-bold text-xl">Bake an image</h1>
      <div className="h-40 grid grid-cols-2 gap-2">
        <Dropzone
          accept="image/png"
          onDrop={(files) => {
            if (files.length > 1) {
              alert("This support only one file upload");
              return;
            }
            setImageFile(files[0]);
            setImageFileUrl(URL.createObjectURL(files[0]));
          }}
        >
          {({ getRootProps, getInputProps }) => (
            <section className="bg-orange-100 hover:bg-orange-200">
              {imageFileUrl ? (
                <div className="h-full w-full flex items-center justify-center">
                  <img src={imageFileUrl} className="h-40" />
                </div>
              ) : (
                <div {...getRootProps()} className="h-full w-full flex items-center justify-center">
                  <input {...getInputProps()} />
                  <p>Drag 'n' drop a PNG image, or click to select files</p>
                </div>
              )}
            </section>
          )}
        </Dropzone>
        <Dropzone
          onDrop={(files) => {
            const reader = new FileReader();

            if (files.length > 1) {
              alert("This support only one file upload");
              return;
            }
            reader.onerror = () => {
              alert(`The file uploaded is not a valid Open Attestation file, error: ${reader.error}`);
            };

            reader.onload = () => {
              try {
                if (reader.result && typeof reader.result === "string") {
                  setOaFile(JSON.parse(reader.result));
                } else {
                  alert(`The file uploaded is not a valid Open Attestation file`);
                }
              } catch (e) {
                alert(`The file uploaded is not a valid Open Attestation file, error: ${e.message}`);
              }
            };

            reader.readAsBinaryString(files[0]);
          }}
        >
          {({ getRootProps, getInputProps }) => (
            <section className="bg-orange-100 hover:bg-orange-200">
              {oaFileValid ? (
                <div className="flex justify-center items-center h-full">
                  <DocumentValidIcon className="h-20 w-20" />
                </div>
              ) : (
                <div {...getRootProps()} className="h-full w-full flex flex-col items-center justify-center">
                  {fragments.length > 0 && !oaFileValid && (
                    <div
                      className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-6"
                      role="alert"
                    >
                      <span className="block sm:inline">Document is not valid</span>
                    </div>
                  )}
                  <input {...getInputProps()} />
                  <p>Drag 'n' drop an Open Attestation file, or click to select files</p>
                </div>
              )}
            </section>
          )}
        </Dropzone>
      </div>
      <div className="flex justify-center mt-2">
        <button
          className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${
            !imageFileUrl || !oaFile ? "disabled opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={bake}
        >
          Bake
        </button>
      </div>
      {bakedImage && (
        <div className="my-2">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">
              Image has been baked successfully, clicked on the image below to download it
            </span>
          </div>
          <div className="flex items-center justify-center mt-2">
            <a href={bakedImage} download>
              <img src={bakedImage} className="h-40 w-40" />
            </a>
          </div>
        </div>
      )}

      <hr className="my-6 border-2" />
      <h1 className="text-center font-bold text-xl">Verify a baked image</h1>
      <div className="h-40 grid grid-cols-1 gap-2">
        <Dropzone
          accept="image/png"
          onDrop={(files) => {
            const reader = new FileReader();

            if (files.length > 1) {
              alert("This support only one file upload");
              return;
            }
            setVImageFileUrl(URL.createObjectURL(files[0]));

            reader.onload = () => {
              png.get(reader.result, keyword, async function (err: any, data: any) {
                if (!err && data) {
                  const oaFile: WrappedDocument<v2.OpenAttestationDocument> = JSON.parse(data.value);
                  setVOaFile(oaFile);
                  setVFragments(await verify(oaFile, { network: "ropsten" }));
                } else {
                  alert(`Something went wrong while reading the file: ${err}`);
                }
              });
            };

            reader.readAsBinaryString(files[0]);
          }}
        >
          {({ getRootProps, getInputProps }) => (
            <section className="bg-orange-100 hover:bg-orange-200">
              <div {...getRootProps()} className="h-full w-full flex items-center justify-center">
                <input {...getInputProps()} />
                <p>Drag 'n' drop an Open Attestation file, or click to select files</p>
              </div>
            </section>
          )}
        </Dropzone>
      </div>
      <div className="grid grid-cols-2">
        {vimageFileUrl ? (
          <div className="h-full w-full flex items-center justify-center">
            <img src={vimageFileUrl} className="h-40" />
          </div>
        ) : null}

        {vfragments.length > 0 && isValid(vfragments) && (
          <div className="h-full w-full flex items-center justify-center">
            <DocumentValidIcon className="h-20 w-20" />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
