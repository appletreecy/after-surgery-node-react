-- CreateTable
CREATE TABLE `AfterSurgeryTableThree` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `numOfJointComplicationCount` INTEGER NULL,
    `numOfMotorDysfunctionCount` INTEGER NULL,
    `numOfTraumaComplicationCount` INTEGER NULL,
    `numOfAnkleComplicationCount` INTEGER NULL,
    `numOfPediatricAdverseEventCount` INTEGER NULL,
    `numOfSpinalComplicationCount` INTEGER NULL,
    `numOfHandSurgeryComplicationCount` INTEGER NULL,
    `numOfObstetricAdverseEventCount` INTEGER NULL,
    `numOfGynecologicalAdverseEventCount` INTEGER NULL,
    `numOfSurgicalTreatmentCount` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AfterSurgeryTableThree` ADD CONSTRAINT `AfterSurgeryTableThree_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
