<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import VueCropper from "vue-cropperjs";
import "cropperjs/dist/cropper.css";
import type { FormRules, UploadFile, UploadInstance, UploadProps, UploadRawFile, UploadUserFile } from "element-plus";
import { genFileId } from "element-plus";
import { pinyin } from "pinyin-pro";

import { base64ToFile, fileToBuffer } from "./utils";

const cropperRef = ref();
const cropperVisible = ref(false);

const birthData = reactive({
  year: "",
  month: "",
  day: "",
});

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smallerOrEqual("md");
const birth = computed(() => `${birthData.year}.${birthData.month}.${birthData.day}`);

const form = reactive({
  order_id: "",
  style: "",
  name: "",
  pinyin: "",
  uid: "",
  birth,
});

const imageList = ref<UploadUserFile[]>([]);
const imageUrl = ref("" as any);

const UID_PATTERN = /^[A-Z0-9\-]*$/;
const BIRTH_PATTERN = /^[0-9]{4}\.[0-9]{2}\.[0-9]{2}$/;

const rules = reactive<FormRules>({
  uid: {
    pattern: UID_PATTERN,
    message: "25位，可包含大写字母、数字或\"-\"",
    len: 25,
    trigger: "blur",
  },
  birth: {
    message: "格式为YYYY.MM.DD",
    trigger: "blur",
    validator: (_, data) => {
      return data === ".." || BIRTH_PATTERN.test(data);
    },
  },
});

const isPinyinModified = ref(false);

const uploadRef = ref<UploadInstance>();

const onExceed: UploadProps["onExceed"] = (files) => {
  uploadRef.value!.clearFiles();
  const file = files[0] as UploadRawFile;
  file.uid = genFileId();
  uploadRef.value!.handleStart(file);
};

const onChange = async (file: UploadFile) => {
  cropperVisible.value = true;
  await nextTick();
  const result = await fileToBuffer(file.raw!);
  imageUrl.value = result;
  cropperRef.value.replace(result);
};

const onCancelUpload = () => {
  imageList.value = [];
  cropperVisible.value = false;
};

const onInputName = () => {
  if (!isPinyinModified.value) {
    form.pinyin = pinyin(form.name);
  }
};

const onCrop = () => {
  const file = base64ToFile(cropperRef.value.getCroppedCanvas().toDataURL()) as any as UploadFile;
  file.uid = genFileId();
  (imageList.value[0].raw as any) = file;
  cropperVisible.value = false;
};

const onPinyinModified = () => {
  isPinyinModified.value = true;
};
</script>

<template>
  <main class="flex flex-col h-full items-center justify-center p-5">
    <ElCard class="md:w-125 w-full">
      <ElAlert
        class="mb-3!"
        :closable="false"
        show-icon
        type="info"
      >
        <p>注：可以不用填写个人真实信息）</p>
      </ElAlert>
      <ElForm label-width="90px" :model="form" :rules="rules">
        <ElFormItem label="订单号" required>
          <ElInput v-model="form.order_id" clearable />
        </ElFormItem>
        <ElFormItem label="style" required>
          <ElInput v-model="form.style" clearable />
        </ElFormItem>
        <ElFormItem label="姓名" required>
          <ElInput v-model="form.name" clearable @input="onInputName" />
        </ElFormItem>
        <ElFormItem label="拼音" required>
          <ElInput v-model="form.pinyin" clearable @input="onPinyinModified" />
        </ElFormItem>
        <ElFormItem label="身份证号" prop="uid">
          <ElInput v-model="form.uid" clearable />
        </ElFormItem>
        <ElFormItem label="出生日期" prop="birth">
          <div class="flex gap-2">
            <ElInput v-model="birthData.year" />.
            <ElInput v-model="birthData.month" />.
            <ElInput v-model="birthData.day" />
          </div>
        </ElFormItem>
        <!-- eslint-disable vue/no-v-model-argument -->
        <ElUpload
          v-model:file-list="imageList"
          ref="uploadRef"
          :auto-upload="false"
          drag
          :limit="1"
          :multiple="false"
          @change="onChange"
          @exceed="onExceed"
        >
          <ElIcon class="el-icon--upload">
            <span class="i-carbon:add-filled" />
          </ElIcon>
          <div class="el-upload__text">
            拖拽文件到此处，或<em>点击上传</em>
          </div>
        </ElUpload>
      </ElForm>
      <ElDialog
        v-model="cropperVisible"
        align-center
        :fullscreen="isMobile"
        :show-close="false"
        title="裁剪"
      >
        <VueCropper
          ref="cropperRef"
          alt="裁剪"
          :aspect-ratio="19.32 / 23.59"
          :src="imageUrl"
        />
        <template #footer>
          <span class="dialog-footer">
            <ElButton @click="onCancelUpload">取消</ElButton>
            <ElButton type="primary" @click="onCrop">
              确认
            </ElButton>
          </span>
        </template>
      </ElDialog>
    </ElCard>
  </main>
</template>
