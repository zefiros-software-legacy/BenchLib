 module BenchViewer.Core
 {
     export enum Regression
     {
         None            = 0x00,
         TimeSlower      = 0x01,
         TimeFaster      = 0x02,
         MemSmaller      = 0x04,
         MemLarger       = 0x08,
         PeakMemSmaller  = 0x10,
         PeakMemLarger   = 0x20
    }
 }