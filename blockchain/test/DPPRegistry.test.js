const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DPPRegistry", function () {
  let DPPRegistry;
  let dppRegistry;
  let owner;
  let issuer;
  let unauthorized;

  beforeEach(async function () {
    // Get signers
    [owner, issuer, unauthorized] = await ethers.getSigners();

    // Deploy contract
    DPPRegistry = await ethers.getContractFactory("DPPRegistry");
    dppRegistry = await DPPRegistry.deploy();
    await dppRegistry.deployed();

    // Authorize issuer
    await dppRegistry.authorizeIssuer(issuer.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await dppRegistry.owner()).to.equal(owner.address);
    });

    it("Should authorize owner as issuer", async function () {
      expect(await dppRegistry.isAuthorizedIssuer(owner.address)).to.be.true;
    });
  });

  describe("Issuer Management", function () {
    it("Should authorize new issuer", async function () {
      await dppRegistry.authorizeIssuer(unauthorized.address);
      expect(await dppRegistry.isAuthorizedIssuer(unauthorized.address)).to.be.true;
    });

    it("Should revoke issuer authorization", async function () {
      await dppRegistry.revokeIssuer(issuer.address);
      expect(await dppRegistry.isAuthorizedIssuer(issuer.address)).to.be.false;
    });

    it("Should not allow non-owner to authorize issuer", async function () {
      await expect(
        dppRegistry.connect(unauthorized).authorizeIssuer(unauthorized.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("DPP Registration", function () {
    const ipfsCid = "QmTestCid123456789";
    const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
    const productId = "PROD-001";
    const supplierInfo = "Supplier Hash";

    it("Should register a new DPP", async function () {
      const tx = await dppRegistry.connect(issuer).registerDPP(
        ipfsCid,
        dataHash,
        productId,
        supplierInfo
      );

      await expect(tx)
        .to.emit(dppRegistry, "DPPRegistered")
        .withArgs(1, ipfsCid, dataHash, issuer.address, productId);

      const dpp = await dppRegistry.getDPP(1);
      expect(dpp.ipfsCid).to.equal(ipfsCid);
      expect(dpp.dataHash).to.equal(dataHash);
      expect(dpp.issuer).to.equal(issuer.address);
      expect(dpp.productId).to.equal(productId);
      expect(dpp.isActive).to.be.true;
    });

    it("Should not allow unauthorized issuer to register DPP", async function () {
      await expect(
        dppRegistry.connect(unauthorized).registerDPP(
          ipfsCid,
          dataHash,
          productId,
          supplierInfo
        )
      ).to.be.revertedWith("Not authorized issuer");
    });

    it("Should not allow duplicate IPFS CID", async function () {
      await dppRegistry.connect(issuer).registerDPP(
        ipfsCid,
        dataHash,
        productId,
        supplierInfo
      );

      const newDataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("different data"));
      await expect(
        dppRegistry.connect(issuer).registerDPP(
          ipfsCid,
          newDataHash,
          "PROD-002",
          supplierInfo
        )
      ).to.be.revertedWith("IPFS CID already registered");
    });

    it("Should not allow duplicate product ID", async function () {
      await dppRegistry.connect(issuer).registerDPP(
        ipfsCid,
        dataHash,
        productId,
        supplierInfo
      );

      const newCid = "QmNewCid987654321";
      const newDataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("different data"));
      await expect(
        dppRegistry.connect(issuer).registerDPP(
          newCid,
          newDataHash,
          productId,
          supplierInfo
        )
      ).to.be.revertedWith("Product already has DPP");
    });
  });

  describe("DPP Verification", function () {
    const ipfsCid = "QmTestCid123456789";
    const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
    const productId = "PROD-001";
    const supplierInfo = "Supplier Hash";

    beforeEach(async function () {
      await dppRegistry.connect(issuer).registerDPP(
        ipfsCid,
        dataHash,
        productId,
        supplierInfo
      );
    });

    it("Should verify DPP by hash", async function () {
      const result = await dppRegistry.verifyByHash(dataHash);
      expect(result.isValid).to.be.true;
      expect(result.dppId).to.equal(1);
      expect(result.ipfsCid).to.equal(ipfsCid);
    });

    it("Should verify DPP by CID", async function () {
      const result = await dppRegistry.verifyByCid(ipfsCid);
      expect(result.isValid).to.be.true;
      expect(result.dppId).to.equal(1);
      expect(result.dataHash).to.equal(dataHash);
    });

    it("Should return false for invalid hash", async function () {
      const invalidHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("invalid"));
      const result = await dppRegistry.verifyByHash(invalidHash);
      expect(result.isValid).to.be.false;
      expect(result.dppId).to.equal(0);
    });

    it("Should get DPP by product ID", async function () {
      const dpp = await dppRegistry.getDPPByProductId(productId);
      expect(dpp.ipfsCid).to.equal(ipfsCid);
      expect(dpp.dataHash).to.equal(dataHash);
      expect(dpp.productId).to.equal(productId);
    });
  });

  describe("DPP Updates", function () {
    const ipfsCid = "QmTestCid123456789";
    const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
    const productId = "PROD-001";
    const supplierInfo = "Supplier Hash";

    beforeEach(async function () {
      await dppRegistry.connect(issuer).registerDPP(
        ipfsCid,
        dataHash,
        productId,
        supplierInfo
      );
    });

    it("Should update DPP", async function () {
      const newCid = "QmNewCid987654321";
      const newHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("new data"));

      const tx = await dppRegistry.connect(issuer).updateDPP(1, newCid, newHash);

      await expect(tx)
        .to.emit(dppRegistry, "DPPUpdated")
        .withArgs(1, newCid, newHash);

      const dpp = await dppRegistry.getDPP(1);
      expect(dpp.ipfsCid).to.equal(newCid);
      expect(dpp.dataHash).to.equal(newHash);
    });

    it("Should deactivate DPP", async function () {
      const tx = await dppRegistry.connect(issuer).deactivateDPP(1);

      await expect(tx)
        .to.emit(dppRegistry, "DPPDeactivated")
        .withArgs(1);

      const dpp = await dppRegistry.getDPP(1);
      expect(dpp.isActive).to.be.false;
    });

    it("Should not verify deactivated DPP", async function () {
      await dppRegistry.connect(issuer).deactivateDPP(1);

      const result = await dppRegistry.verifyByHash(dataHash);
      expect(result.isValid).to.be.false;
    });
  });

  describe("Utility Functions", function () {
    it("Should return total DPP count", async function () {
      expect(await dppRegistry.getTotalDPPs()).to.equal(0);

      await dppRegistry.connect(issuer).registerDPP(
        "QmCid1",
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("data1")),
        "PROD-001",
        "Supplier1"
      );

      expect(await dppRegistry.getTotalDPPs()).to.equal(1);

      await dppRegistry.connect(issuer).registerDPP(
        "QmCid2",
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("data2")),
        "PROD-002",
        "Supplier2"
      );

      expect(await dppRegistry.getTotalDPPs()).to.equal(2);
    });
  });
});

