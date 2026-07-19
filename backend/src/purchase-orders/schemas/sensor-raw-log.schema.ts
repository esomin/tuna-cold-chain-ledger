import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'sensor_raw_logs', timestamps: true })
export class SensorRawLog extends Document {

    @Prop({ required: true, index: true })
    poNumber: string;

    @Prop({ required: true, type: Number })
    temperature: number;

    @Prop({ required: true, type: Number })
    latitude: number;

    @Prop({ required: true, type: Number })
    longitude: number;

    @Prop({ default: Date.now, type: Date })
    timestamp: Date;
}

export const SensorRawLogSchema = SchemaFactory.createForClass(SensorRawLog);
