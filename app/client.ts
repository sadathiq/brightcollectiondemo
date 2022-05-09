import * as anchor from "@project-serum/anchor";
import { Program, Wallet, Provider } from "@project-serum/anchor";
import { Brightcollection } from "../target/types/brightcollection";

import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  MINT_SIZE,
} from "@solana/spl-token";
import  "@solana/web3.js";

async function execute(){
  var fs = require("fs");
  // Configure the client to use the local cluster.
  console.log("Hello");
  anchor.setProvider(anchor.Provider.env());

// const program = anchor.workspace.Brightcollection as Program<Brightcollection>;

  // Read the generated IDL.
const idl = JSON.parse(
  fs.readFileSync("./target/idl/brightcollection.json", "utf8")
);

// Address of the deployed program.
const programId = new anchor.web3.PublicKey("6LK3PU91hdDRspgVmv6CxasLUz7eXv9KKzDGsQTWUcT1");

// Generate the program client from IDL.
const program = new anchor.Program(idl, programId);
  
    console.log("STARTING");
    const { PublicKey, SystemProgram } = anchor.web3;
    const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );
    const lamports: number =
      await program.provider.connection.getMinimumBalanceForRentExemption(
        MINT_SIZE
      );

      console.log("Lamports :", lamports);

    const getMetadata = async (
      mint: anchor.web3.PublicKey
    ): Promise<anchor.web3.PublicKey> => {
      return (
        await anchor.web3.PublicKey.findProgramAddress(
          [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
          ],
          TOKEN_METADATA_PROGRAM_ID
        )
      )[0];
    };

    console.log("Metadata got");

    const getMasterEdition = async (
      mint: anchor.web3.PublicKey
    ): Promise<anchor.web3.PublicKey> => {
      return (
        await anchor.web3.PublicKey.findProgramAddress(
          [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
            Buffer.from("edition"),
          ],
          TOKEN_METADATA_PROGRAM_ID
        )
      )[0];
    };

    console.log("Master Edition GOT");

    const mintKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    const myAccount = anchor.web3.Keypair.generate();


    let secretKey = Uint8Array.from( [162,10,12,99,144,196,175,216,70,8,110,159,177,205,102,116,112,225,96,245,7,150,59,46,222,212,126,85,212,41,253,199,36,239,136,108,164,50,199,60,26,18,90,21,87,110,88,138,115,41,231,147,22,158,162,208,246,167,158,60,85,137,53,127]);
    let walletWrapper = new anchor.Wallet(anchor.web3.Keypair.fromSecretKey(secretKey));
    

    const NftTokenAccount = await getAssociatedTokenAddress(
      mintKey.publicKey,
      walletWrapper.publicKey//program.provider.wallet.publicKey
    );
    console.log("NFT Account: ", NftTokenAccount.toBase58());
    const mint_tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: walletWrapper.publicKey,//program.provider.wallet.publicKey
        newAccountPubkey: mintKey.publicKey,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
        lamports,
      }),
      createInitializeMintInstruction(
        mintKey.publicKey,
        0,
        walletWrapper.publicKey,//program.provider.wallet.publicKey,
        walletWrapper.publicKey,//program.provider.wallet.publicKey
      ),
      createAssociatedTokenAccountInstruction(
        walletWrapper.publicKey,//program.provider.wallet.publicKey,
        NftTokenAccount,
        walletWrapper.publicKey,//program.provider.wallet.publicKey,
        mintKey.publicKey
      )
    );
    
    console.log("PASSED MINT TRANSACTION");
   
    const res = await program.provider.send(mint_tx, [mintKey]);    


    
    console.log("Transaction Completed");
    console.log(
      await program.provider.connection.getParsedAccountInfo(mintKey.publicKey)
    );
    console.log("Account: ", res);
    console.log("Mint key: ", mintKey.publicKey.toString());
    console.log("User: ", walletWrapper.publicKey.toString());//program.provider.wallet.publicKey.toString());
    const metadataAddress = await getMetadata(mintKey.publicKey);
    const masterEdition = await getMasterEdition(mintKey.publicKey);
    console.log("Metadata address: ", metadataAddress.toBase58());
    console.log("MasterEdition: ", masterEdition.toBase58());


    const tx = await program.rpc.mintNft(
      mintKey.publicKey,
      "https://arweave.net/y5e5DJsiwH0s_ayfMwYk-SnrZtVZzHLQDSTZ5dNRUHA",
      "Nuwans NFT #1",
      {
        accounts: {
          mintAuthority: walletWrapper.publicKey,//program.provider.wallet.publicKey,
          mint: mintKey.publicKey,
          tokenAccount: NftTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          metadata: metadataAddress,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          payer: walletWrapper.publicKey,//program.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          masterEdition: masterEdition,
        },
      }
    );
    console.log("Your transaction signature", tx);
  

}

execute();