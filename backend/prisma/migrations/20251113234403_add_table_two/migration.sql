-- CreateTable
CREATE TABLE `AfterSurgeryTableTwo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `numOfAbdominalDistension` INTEGER NULL,
    `numOfAllergicRash` INTEGER NULL,
    `numOfChestDiscomfort` INTEGER NULL,
    `numOfDelirium` INTEGER NULL,
    `numOfDizziness` INTEGER NULL,
    `numOfEndotrachealIntubationDiscomfort` INTEGER NULL,
    `numOfEpigastricPain` INTEGER NULL,
    `numOfItching` INTEGER NULL,
    `numOfNauseaAndVomiting` INTEGER NULL,
    `numOfNauseaAndVomitingAndDizziness` INTEGER NULL,
    `numOfOther` INTEGER NULL,
    `numOfProlongedAnestheticRecovery` INTEGER NULL,
    `numOfPunctureSiteAbnormality` INTEGER NULL,
    `numOfTourniquetReaction` INTEGER NULL,
    `otherComments` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AfterSurgeryTableTwo` ADD CONSTRAINT `AfterSurgeryTableTwo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
