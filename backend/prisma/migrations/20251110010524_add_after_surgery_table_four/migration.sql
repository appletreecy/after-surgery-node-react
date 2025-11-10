-- CreateTable
CREATE TABLE `AfterSurgeryTableFour` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `numOfFormulationOne` INTEGER NULL,
    `numOfFormulationTwo` INTEGER NULL,
    `numOfFormulationThree` INTEGER NULL,
    `numOfFormulationFour` INTEGER NULL,
    `numOfFormulationFive` INTEGER NULL,
    `numOfFormulationSix` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AfterSurgeryTableFour` ADD CONSTRAINT `AfterSurgeryTableFour_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
