// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type XCMTransferProps = Omit<XCMTransfer, NonNullable<FunctionPropertyNames<XCMTransfer>>>;

export class XCMTransfer implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public blockNumber?: bigint;

    public timestamp?: string;

    public fromAddress?: string;

    public fromAddressSS58?: string;

    public fromParachainId?: string;

    public toAddress: string;

    public toAddressSS58?: string;

    public toParachainId: string;

    public assetId: string[];

    public amount: string[];

    public assetIdTransferred?: string[];

    public amountTransferred?: string[];

    public xcmpMessageHash?: string;

    public xcmpMessageStatus?: string;

    public xcmpTransferStatus?: string[];

    public xcmpInstructions?: string[];

    public warnings: string;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save XCMTransfer entity without an ID");
        await store.set('XCMTransfer', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove XCMTransfer entity without an ID");
        await store.remove('XCMTransfer', id.toString());
    }

    static async get(id:string): Promise<XCMTransfer | undefined>{
        assert((id !== null && id !== undefined), "Cannot get XCMTransfer entity without an ID");
        const record = await store.get('XCMTransfer', id.toString());
        if (record){
            return XCMTransfer.create(record as XCMTransferProps);
        }else{
            return;
        }
    }



    static create(record: XCMTransferProps): XCMTransfer {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new XCMTransfer(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
