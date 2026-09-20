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

  @Prop({ required: false, type: String })
  eventNote?: string;

  @Prop({
    required: false,
    type: String,
    enum: ['HARVESTED', 'PROCESSING', 'IN_TRANSIT', 'DELIVERED'],
    default: 'HARVESTED',
    index: true,
  })
  stage?: string;

  @Prop({ required: false, type: Number })
  targetTemp?: number;

  @Prop({ required: false, type: Number })
  warningTemp?: number;

  @Prop({ required: false, type: Boolean, default: false })
  isFreezing?: boolean;
}

export const SensorRawLogSchema = SchemaFactory.createForClass(SensorRawLog);
